---
title: kubernetes, the fire hose
date: 2023-01-09
lastmod: 2023-05-04
mermaid: true
toc: true
readingtime: true
tags:
  - microservices
  - kubernetes
  - knative
  - containers
  - reliability
  - golang
  - deployments
  - dns
summary: The frustrating tale of my struggle with getting a production system running on Kubernetes (particularly AWS EKS) starting with virtually no experience.
---

> **NOTE** \
> Given that my knowledge of Kubernetes is nowhere near complete, I will come back and edit this post as I learn more.

In March 2022, I began my **JOURNEY** of using Kubernetes. Here's me at the start:

{{<rawhtml>}}
<center>
  <img src="/img/k8s_drowning.jpg" alt="Panel 1 shows a hand reaching out of water labeled as first-time Kubernetes newb. Panel 2 shows a different hand labeled as Kubernetes post on Reddit reaching towards the first hand. Panel 3 shows the two hands high-fiving, labeled as Kubernetes is so easy. In Panel 4, the first hand drowns." />
</center>
{{</rawhtml>}}

Ultimately, this is my own learning postmortem for how to get an end-to-end site up and running. I always find the process of going from "I know nothing" to "I know a few things" interesting because once you cross a certain threshold of knowlege gained, it becomes difficult to put yourself into the shoes of the true beginner again. Of course, in hindsight, I could have solved most things much quicker, but this is my honest experience starting as a complete beginner, struggling with unknown unknowns because I was so inexperienced I didn't even know where to begin.

## my requirements

My objective was to deploy microservices on Kubernetes, some of which would talk to a front end (e.g. Netlify or Vercel) and some of which would talk to each other or other services outside (e.g. gRPC or scraping endpoints).

These requirements implied that I would need networking and [TLS](https://www.cloudflare.com/learning/ssl/transport-layer-security-tls/) to establish trust for the microservices and protect the requests and responses.

On top of that, I needed to get this up and running fast -- I only had about 2 or 3 weeks.

> **NOTE**
> One might ask whether it's a premature optimization to go from nothing to Kubernetes. Perhaps. In this case, I mostly knew what I was getting into (suffering), and I needed to use/learn this at one point or another anyways. I could have bootstrapped our services much quicker had I used Google Cloud Run or Amazon Fargate, but Kubernetes was always an objective.

## my background

Prior to using Kubernetes, my experience comprised school (Carnegie Mellon University) and working at Google. I knew about packaging code (C++, sometimes Go) into binaries to run them on machines, but this was usually a task already handled by an automated system. I generally could relate Kubernetes concepts to other concepts I understood (cron jobs, batch jobs, long-running services), but I didn't have any hands-on experience with Kubernetes itself. Although I had used Google's in-house Infrastructure as Code (IaC) alternatives, I had never had to set anything up from scratch.

I went into this learning process blind.

## my resources

My resources were mostly documentation and tutorials that I could search for online. However, there were some situations that no matter how hard I tried, I couldn't figure out what piece I was missing. Enter [Wilson Husin](https://husin.dev).

The alternate title for this post is "Simping for Wilson".

In addition to being my favorite person, Wilson also has prior expertise with both the intricacies of Kubernetes (Pivotal and VMware) and deploying apps to clusters (from side projects). Whenever I ran into an issue that I didn't know how to Google, Wilson was always there to point me in the right direction.

## my final setup

{{<mermaid>}}
flowchart TB
  %% Nodes
  EKS(EKS<br>- Elastic Kubernetes<br>Services)
  ArtifactRegistry(Google Artifact Registry<br>- hosts images)
  GCS(Google Cloud Storage<br>- saves versioned<br>buckets)
  Ko[<code>ko-build/ko</code><br>- build, deploy, and<br>upload Go images]
  Main[Main packages<br>- the source code to build]
  YAML[YAMLs<br>- deployment configs<br>- secret configs]
  Secrets[Secrets<br>- kept in env<br>variables]
  Terraform[<code>terraform</code><br>- manages infrastructure<br>as code]

  %% Formatting
  EKS --> GCS
  linkStyle 0 display:none;

  %% Edges
  Ko -->|builds| Main
  Ko -->|uploads| ArtifactRegistry
  Secrets -->|on-the-fly substitution<br> with ytt| YAML
  Terraform -->|stores state| GCS
  Terraform -->|owns creation,<br>update, delete| EKS

  subgraph GCP[Google Cloud Platform]
    ArtifactRegistry
    GCS
  end

  subgraph AWS[Amazon Web Services]
    EKS
  end

  subgraph Machine[My Machine]
    Secrets
    Ko
    Terraform

    subgraph Repo[The Repository]
      YAML
      Main
    end
  end
{{</mermaid>}}

{{<figure id="1">}}
How files within my machine (and other coworkers') are used to build images and create resources in cloud platforms.
{{</figure>}}

{{<mermaid>}}
flowchart TB
  %% Nodes
  Cluster(EKS<br>- Elastic Kubernetes<br>Services)
  ArtifactRegistry(Artifact Registry<br>- hosts images)
  YAML[YAMLs<br>- deployment configs<br>- secret configs]
  Kourier[Kourier<br>- network manager]
  MyService[my-service<br>externally visible endpoint]
  MyDeployment[my-deployment]
  MyReplicaSet[my-replicaset]
  MyPod[my-pod]
  OtherPod[other-pod]

  %% Formatting

  %% Edges
  MyService -->|manages| MyDeployment -->|manages| MyReplicaSet -->|manages| MyPod
  Knative -->|manages|MyService
  YAML -->|deployed with <code>kubectl</code>| MyService
  MyPod -->|pulls image| ArtifactRegistry

  %% Subgraphs %%
  subgraph GCP[Google Cloud Platform]
    ArtifactRegistry
  end

  subgraph Machine[My Machine]
    YAML
  end

  subgraph AWS["Amazon Web Services (AWS)"]
    subgraph Cluster[Cluster on EKS]
      subgraph NodeGroup[Managed node group]
        subgraph Node1[Node 1]
          MyPod
        end

        subgraph Node2[Node 2]
          OtherPod
        end
      end

      subgraph Knative[Knative Serving]
        Kourier
      end

      MyService
      MyDeployment
      MyReplicaSet
    end
  end
{{</mermaid>}}

{{<figure id="2">}}
Once the resources are created, this is how the services are deployed. Of course, Kourier is also a pod that is running on one of the nodes, but here we're looking at it as a logical abstraction.
{{</figure>}}

{{<mermaid>}}
flowchart TB
  %% Nodes
  Cluster(EKS<br>- Elastic Kubernetes<br>Services)
  Vercel[<b>Vercel</b><br>Host our frontend]
  Kourier[Kourier<br>Network manager]
  DNS[Cloud DNS]
  Service[my-service<br>GraphQL service]

  %% Formatting

  %% Edges
  DNS -->|wildcard record to| Kourier
  DNS -->|CNAME record to| Vercel
  Knative -->|manages| Service

  %% Subgraphs %%
  subgraph GCP[Google Cloud Platform]
    DNS
  end

  subgraph AWS["Amazon Web Services (AWS)"]
    subgraph Cluster[Cluster on EKS]
      subgraph Knative[Knative Serving]
        Kourier
      end
      Service
    end
  end
{{</mermaid>}}

{{<figure id="3">}}
How our DNS is configured.
{{</figure>}}

## a detailed descent into my madness

When faced with a challenge that one has no experience with, where does one begin?

The following sections are in logical order, not chronological order. Sometimes I was tackling three different problems all at once, but for the sake of clarity, I've separated each issue to make it easier to understand the nuances of each task.

### managing images with `ko` and Vercel

The first part of running code in a generic environment is actually packaging that code up so that it can run somewhere. Our previous method was to compile the binary to Linux and transfer that file over to the relevant VM through secure copying (`scp`).

{{<code language="bash" connotation="neutral" title="Using `go` to build a binary">}}
env GOOS=linux GOARCH=amd64 go build -v -o bin/service_lx path/to/service/main.go
{{</code>}}

The next foray was to compile them into a container image that could be put anywhere. To do that, I thought I'd write a [`Dockerfile`](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/) (complete with [small Go container](https://www.mirantis.com/blog/how-to-make-very-small-containers-for-golang-binaries/) tutorials) since that's how you run Go in Docker, right? (wrong)

This is what the Dockerfile looked at the smallest I could get it, but I had varying levels of `COPY` statements that I progressively trimmed down until I could get a roughly 25MB image.

{{<code language="dockerfile" title="Beginner Dockerfile" connotation="neutral">}}
# syntax=docker/dockerfile:1

# Use the base Linux-based distro so that we have access to bash.
FROM alpine

# Copy the compiled binary.
COPY ./bin/service_lx /go/bin/service

# The container will listen to this port.
# https://docs.docker.com/engine/reference/builder/#expose
EXPOSE 3031

CMD [ "/go/bin/service" ]
{{</code>}}

I was pretty happy with the smaller image size, but when I told Wilson, he immediately mentioned [ko-build/ko](https://github.com/ko-build/ko). This solved all my problems -- the Go container images ended up being only 12.7MB, way less than however much I could do with pure Dockerfiles. And the setup was so easy.

{{<code language="bash" title="Building, tagging, uploading an image with `ko-build/ko`" connotation="good">}}
KO_DOCKER_REPO=<upload URL> ko build --base-import-paths --platform linux/amd64 --tags latest ./path/to/service
{{</code>}}

The Go image size comparisons are here:

|Build Method|Size|Rel. % Diff |Abs. % Diff|
|---|---|---|---|
|Copying entire codebase...including frontend|2.3GB|||
|Trimming|1.84GB|-20%|-20%|
|Trimming|1.05GB|-43%|-54%|
|Build and only copy binary (this Dockerfile)|24.9MB|-97%|-98%|
|Use `ko-build/ko`|12.7MB|-49%|-99%|

That still left the front end. I thought, well the Go microservices worked out, so let's try to write a Dockerfile for NextJS as well (spoiler alert: a terrible idea). Lots of guides said it was possible, and so we tried. To make a long and bitter story short, my coworker and I tried all sorts of variations. Our results were either a 2GB+ image or a >100MB image that didn't even work and took >10 minutes to build. Also at the time, Comcast was capping our monthly usage to 1TB (then you pay extra), so uploading a huge image wouldn't bode well for my internet costs... 💀 So I vented to Wilson.

{{<chat sender="me" position="right">}}
I'm trying to deploy a NextJS app, but building takes 648 seconds 😭 And it's 120 MB.
{{</chat>}}

{{<chat sender="Wilson" position="left">}}
Javscript environments are difficult, which is why Vercel and Netlify (public deploys) do so well. Try using [buildpacks.io](https://buildpacks.io/) and see if it's any better.

If you're already separating your app between frontend and backend, then it's worth considering a stateless frontend that can be deployed publicly. Potentially even on edge too.
{{</chat>}}

{{<chat sender="me" position="right">}}
Oh snap.
{{</chat>}}

Both of these services ended up working within 5 minutes of granting permissions to our repository in GitHub. Moral of the story: pay someone to do it faster.

I ended up going with Vercel over Netlify though since Netlify only allowed 1 email to be associated with 1 GitHub user, and... I mean I do need to host this site too.

### managing the cluster with `terraform`

Now I just needed somewhere to run these images.

Previously, we were using virtual machines (VMs) in Google's [Compute Engine](https://cloud.google.com/compute) (GCE), but this required us to manually copy the binary into the VM to run.

{{<code connotation="neutral" title="Manually running on a Compute Engine VM" language="bash">}}
# Copy the locally built binary into the VM.
gcloud compute scp bin/service_lx "${VM_NAME}":~ --zone="${ZONE}" --project "${PROJECT}
# Run the binary in the background and output logs to a file.
# https://stackoverflow.com/questions/19955260/what-is-dev-null-in-bash
gcloud compute ssh "${USER}@${VM_NAME}" --zone="${ZONE}" --project "${PROJECT}" \
	--command="nohup ./service_lx > service_lx.logs 2>&1 < /dev/null &"
{{</code>}}

As our next step, I decided to move us to Google [Kubernetes Engine](https://cloud.google.com/kubernetes-engine) (GKE) since we were already using Google Cloud Platform (GCP). I started off by creating the cluster and the resources by hand. But, there were a few frustrating problems I ran into.

1. Lingering costs when I forgot to delete something if I decided to make a new cluster
2. Lack of repeatability since I easily forgot to run a step without perfect documentation and execution
3. Mind-numbing boredom while manually waiting for each step to complete
4. Someone else could be running something that conflicts with changes I'm making
5. Do I have to do this again if I want a prod and a dev cluster?

During a vent session with Wilson, he strongly suggested using something like [Terraform](https://terraform.io/) (IaC tool) to do all these commands programmatically. I recall being irrationally stubborn for a bit since I had the notion that Terraform would abstract everything away automagically and I wanted to learn how to run the commands myself. Turns out, the configs you set up in Terraform are essentialy a 1-to-1 mapping back to the configs you'd have to manually put in. My bullheadedness didn't last long though, thankfully.

{{<code language="hcl" title="Instantiate a Kubernetes cluster in GKE" connotation="neutral">}}
# https://www.terraform.io/language/providers/requirements#requiring-providers
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">=4.14.0"
    }
  }
}

# Provide configuration details about the GCP account.
# https://registry.terraform.io/providers/hashicorp/google/latest/docs
provider "google" {
  credentials = file(var.credentials_file)

  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Stores the state of `terraform apply` to Google Cloud Storage.
# https://www.terraform.io/language/settings/backends/gcs
terraform {
  backend "gcs" {
    # Variables are provided as part of `terraform init` through
    # *-backend.tfvars
  }
}

# GKE cluster definition.
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/container_cluster
resource "google_container_cluster" "default" {
  name     = var.cluster_name
  location = var.region

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1
}

# Node pool for the GKE cluster defined above.
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/container_node_pool
resource "google_container_node_pool" "default" {
  name       = "primary-node-pool"
  cluster    = google_container_cluster.default.id
  node_count = 1

  node_config {
      machine_type = "e2-standard-2"
      # Google recommends custom service accounts that have cloud-platform scope
      # and permissions granted via IAM Roles.
      service_account = var.service_account

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
{{</code>}}

All of my problems were solved.

1. Costs - Terraform owns these resources, so if you remove it, poof, it's gone!
2. Repeatability - It's all code, baby.
3. Boredom - Terraform runs all the steps, so I can go do something else.
4. Conflicts - Our remote backend in GCS is the mutex for applying updates.
5. Multiple clusters - [Workspaces](https://developer.hashicorp.com/terraform/language/state/workspaces) unlocked variable management for dev vs. prod.

And something I haven't mentioned yet -- doing cluster tear downs and creations with tiny changes was now much easier. This aspect is important for [managing the nodes](#managing-the-nodes).

### managing the YAMLs and secrets

I haven't gotten to deep dive into secrets management systems yet, so this section will be quite bare.

We currently store YAMLs in our repository and use [Makefiles](https://www.gnu.org/software/make/) to keep track of what commands to run to deploy to our cluster. We use [`ytt`](https://carvel.dev/ytt/) to substitute secrets into the YAMLs from our local environment variables. And we use [`direnv`](https://direnv.net/) to keep our environment variables populated while working in our repository.

{{<code language="yaml" connotation="neutral" title="`do_something.yaml` using `ytt`">}}
#@ load("@ytt:data", "data")
apiVersion: batch/v1
kind: CronJob
metadata:
  name: do-something
  namespace: misc
spec:
  schedule: "*/5 * * * MON-FRI"
  jobTemplate:
    spec:
      activeDeadlineSeconds: 120
      template:
        spec:
          containers:
          - name: do-something
            image: curlimages/curl:7.85.0
            imagePullPolicy: IfNotPresent
            command:
            - /bin/sh
            - -c
            #! Comment: print something out.
            - #@ "echo " + str(data.values.some.value)
          restartPolicy: OnFailure
{{</code>}}

{{<code language="bash" connotation="neutral" title="Deploying a resource to the Kubernetes cluster">}}
ytt -f do_something.yaml --data-value "some.value=${SOME_VALUE}" | kubectl apply -f -
{{</code>}}

> Fun fact: When I first started using `kubectl`, I pronounced it koo·**bek**·toʊl. Wilson literally keeled over laughing. Now I call it kyoob·**kuh**·tl.

There are many weaknesses to this approach for storing secrets though -- What if everyone's laptops break? How does everyone receive updated credentials? What if someone else gets access to someone's laptop? We need to make credential rotation easier.

In the future, I'd love to get automatic deploys and a more robust secrets management solution (i.e. [HashiCorp Vault](https://www.vaultproject.io/) or a key management service ([AWS](https://aws.amazon.com/kms/), [GCP](https://cloud.google.com/security-key-management))).

### managing the networking and tls

Cool, so we had all the images to run our services, and now I just needed to get them all to talk to each other. Should be easy, right? (wrong)

My first instinct was to throw myself head first into [Ingresses](https://kubernetes.io/docs/concepts/services-networking/ingress/). But recall that I also knew I needed TLS. I ran through (incompletely) [Kelsey Hightower](https://github.com/kelseyhightower)'s [Kubernetes The Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way) tutorial. My time was split between developing features and also standing up the cluster, so unfortunately, I was not in the right mindset to absorb the tutorial.

I forget what originally prompted our conversation, but Wilson sent me a [Knative demo](https://www.youtube.com/watch?v=Ceyf2QfnVqU) by [Scott Nichols](https://github.com/n3wscott). They briefly worked with each other in the past, and Scott contributed extensively to Knative. After watching the video and seeing how easily I could stand up services using Knative, I was sold.

In particular, [Knative Serving](https://knative.dev/docs/serving/) seemed to handle most of what I needed since it supports [auto-TLS certs](https://knative.dev/docs/serving/using-auto-tls/) through [Cert Manager](https://cert-manager.io/). Knative itself supports various options for the [networking layer](https://knative.dev/docs/install/yaml-install/serving/install-serving-with-yaml/#install-a-networking-layer). Since Knative has a strong opinion on most things in Kubernetes while allowing flexibility, it has given me the opportunity to get a working cluster and deep dive into particular points that I want to learn more about (e.g. [exposing non-Knative services through ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types)). This is also how I first became comfortable with the `kubectl` commands checking status of services, deployments, certs, etc.

⭐️ The Knative [installation docs](https://knative.dev/docs/install/operator/knative-with-operators/) (through the Operator) were excellent. ⭐️

{{<mermaid>}}
sequenceDiagram
  actor User
  participant DNS as Google<br>Cloud DNS
  participant Vercel as Vercel<br>frontend.example.com<br>Hosts frontend
  participant Kourier as Kourier<br>backend.example.com<br>Cluster<br>external endpoint
  participant Service as Service<br>service.backend.example.com<br>Publicly accessible<br>service in cluster
  User->>+DNS: I want frontend.example.com
  DNS->>-User: here ya go
  User->>+Vercel: Give me your site
  Vercel->>-User: okie dokie
  User->>+DNS: Site from Vercel:<br>I need service.backend.example.com
  DNS->>-User: here ya go
  User->>Kourier: Give me data
  activate Kourier
  Kourier->>+Service: Hey someone's asking for you
  deactivate Kourier
  Service->>-User: okie dokie
{{</mermaid>}}

{{<figure id="4">}}
Here's what our DNS resolution looked like in the end.
{{</figure>}}

Despite the hand holding, I made some _YIKES_ mistakes along the way.

#### 😱 LetsEncrypt can rate-limit you

[LetsEncrypt](https://letsencrypt.org/) is a nonprofit Certificate Authority providing [TLS](https://www.cloudflare.com/learning/ssl/transport-layer-security-tls/) Certificates. Knative auto-TLS works by specifying a TLS issuer (in my case, LetsEncrypt) where Knative Serving will automatically send certificate requests to the issuer for each managed service so that users know they can trust the endpoint when they query it.

What I didn't know was... if you get the request wrong enough times, LetsEncrypt [rate limits](https://letsencrypt.org/docs/rate-limits/) you by domain and IP address. That's why LetsEncrypt provides a [staging environment](https://letsencrypt.org/docs/staging-environment/) with a higher rate limit for testing. But since I blindly followed the auto-TLS tutorial which used the prod environment, I was essentially testing against the prod environment. 🙃

Guess what happened? We got rate limited!!

{{<rawhtml>}}
<center>
  <img src="/img/letsencrypt_rate_limit.jpg" alt="Rate-limited by LetsEncrypt text over SpongeBob in an office on fire." />
</center>
{{</rawhtml>}}

Even worse, we needed the site to be up and running for a meeting, and the rate limit lasts a week before you can try again.

Fortunately, we had a backup domain name that we were going to use for our dev cluster. At this point, we didn't have a dev cluster yet, so using a different domain worked at the very least. For the original domain name, I ended up waiting a week for the rate limit to run out before trying again **with the staging environment**.

#### packaged installs > loose YAMLs

My initial installation of Knative involved downloading the Knative Serving, networking, and Cert Manager files manually and applying them all (literally `curl` and then `kubectl apply -f`). However, with this method of installation, [upgrading Knative](https://knative.dev/docs/install/upgrade/upgrade-installation/) versions proved difficult as they need to be incremented 1 at a time, and I needed to make sure I was applying the correct YAMLs in the right order.

* [Knative Operator](https://knative.dev/docs/install/operator/knative-with-operators/) handles creating the Knative YAMLs.
* Cert Manager [Helm repository](https://cert-manager.io/docs/installation/helm/#installing-with-helm) was easier to manage.

> [Helm charts](https://helm.sh/) are packaged Kubernetes applications. I've found these *especially* helpful for deploying third-party applications into our clusters.

#### some networking layers are chonky (red herring)

I first decided to use [Contour](https://github.com/knative-sandbox/net-contour) as the networking layer. This proved to be (what I thought was) a mistake as the Contour service created a daemonset with pods on each node. What happened in reality was that the pods were so large, the nodes frequently consumed too much CPU or Memory and became `NotReady`. Of course, this wasn't a problem with the pods (foreshadowing for [managing the nodes](#managing-the-nodes)), but the size of the pods exacerbated the problem even more.

I then decided to use [Kourier](https://github.com/knative-sandbox/net-kourier) which has been working quite well. The nodes dying issue was still present, but it seemed to happen much less frequently than Contour. So the problem was at least mitigated.

### managing the nodes

Welcome to suffering.

#### the cloud platform

First, I dove into [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine) (GKE) but ultimately migrated over to [Amazon Elastic Kubernetes Service](https://aws.amazon.com/eks/) (EKS). Why? Money. Was this a mistake? ¯\\\_(ツ)\_/¯

Picture this:

I've just migrated from GKE to EKS. On GKE, our nodes were doing fine as far as I could tell. As soon as I move over to EKS, nodes are transitioning into the `NotReady` state all the time. 😱 OK, so I figure out that you can manually delete the bad nodes (`kubectl delete node <insert node name>`). BUT, AWS doesn't automatically give you another node to top you up. So, then I had to re-apply Terraform settings with increased `desired_size` to get my node back... and this was happening multiple times a week.

I did't have SSH access into the node instances themselves, so whatever is causing the nodes to stop reporting their status is a mystery to me. And then I read Alexander Potasnick's [comparison](https://acloudguru.com/blog/engineering/aks-vs-eks-vs-gke-managed-kubernetes-services-compared) between different managed Kubernetes services and see that "[EKS has] no automatic node health repair".[^1]

{{<center>}}
![NO](https://media4.giphy.com/media/KhliiAkDFP9YY/200w.gif?cid=82a1493bdq21aq0x8ueebwnwp95m2r1x0kcrp4xhg02zciyc&rid=200w.gif&ct=g)
{{</center>}}

I didn't want to have to do the manual stuff forever. 😭 But the main problem was that we couldn't get into the node to look at the logs to debug. Our nodes were in a private VPC that we hadn't exposed to ourselves yet.

#### ssh access

Thankfully, my coworker got the SSH access up and running. This was setup through a Bastion instance, to which SSH access was gated by a keypair. Once inside the Bastion instance, folks are able to SSH to the desired nodes. SSH access unlocked a whole new world of debugging capabilities. I had seen "just run `journalctl -u kubelet`" in various StackOverflow posts before, and now those posts finally made sense. We were able to pinpoint a few reasons for nodes going down, some of which were recoverable, others which weren't.

|Manual Resolution|SSH Access?|Problem|
|---|---|---|
|n/a|✅|Transient issues with pods in Knative Serving which recovered on their own. In these cases, there was usually 1 affected node in a temporary `NotReady` state.|
|SSH into bad node, restart Kubelet|✅|Node couldn't schedule anything because we ran out of IPs.|
|Fix config map|✅|Misconfiguring our config maps and not being authenticated.|
|Manually delete node and grab another|❌|Node(s) trying to schedule as much as it could and ends up pinning itself from using more resources than it has.|

{{<code language="bash" title="SSH into bad node to restart Kubelet" connotation="good">}}
# Become superuser
sudo su
# Stop the current running Kubelet.
systemctl stop kubelet
# Restart Kubelet with the extra args
CLUSTER_NAME=
NODE_GROUP_NAME=
AMI_IMAGE=
MAX_PODS= # Determined by your machine size (see preset limits below)
/etc/eks/bootstrap.sh ${CLUSTER_NAME} \
  --kubelet-extra-args "--node-labels=eks.amazonaws.com/nodegroup-image=${AMI_IMAGE},eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=${NODE_GROUP_NAME} --max-pods=${MAX_PODS} --kube-reserved memory=0.3Gi,ephemeral-storage=1Gi --system-reserved memory=0.2Gi,ephemeral-storage=1Gi --eviction-hard memory.available<200Mi,nodefs.available<10%"
# Verify that the new Kubelet instance has the correct args
ps aux | grep kubelet
{{</code>}}

With access to the nodes though, this meant we could attempt to modify how the Kubelet was run. We started by first manually changing the Kubelet extra args. This meant SSH-ing into the node, then re-running the [EKS bootstrap script](https://github.com/awslabs/amazon-eks-ami/blob/master/files/bootstrap.sh). I ran into a few snags with the script not recognizing `CLUSTER_NAME` even though I set it last positionally, but setting it first seemed to work.

> Fun fact: Amazon EKS has [preset limits](https://github.com/aws/amazon-vpc-resource-controller-k8s/blob/7b8ae36fe5cd3f2cb6a16b9585cbe905c52cd34c/pkg/aws/vpc/limits.go#L278) for how many pods can run on each type of machine. I later realized that this preset limit is due to the number of IPs assigned to each machine, but my first instinct was to change the number of allowed pods on a node.

This was a great temporary solution. Our production environment ran smoothly for over a month. However, since we were making changes to our dev environment, dev was still breaking every so often. And since restarting Kubelet was a manual process, if someone forgot to run the command, the nodes were going to die anyways.

{{<rawhtml>}}
<center>
  <img src="/img/prod_is_scary.jpg" alt="A skeleton with a gun approaches a girl hiding under a desk. The skeleton is labled as prod being up for more than 1 month. The girl is labeled as me needing to touch prod and maybe break it." />
</center>
{{</rawhtml>}}

#### automation, launch templates, and `systemd`

The logical step after manually rebooting nodes with our specific flags is to automate this process.

Unfortunately, I then learned that SSH remote access on a managed EKS node group is incompatible with launch templates, which are required to specify Kubelet extra args. Thankfully, a [StackOverflow post](https://stackoverflow.com/questions/68894525/how-to-pass-kubelet-extra-args-to-aws-eks-node-group-created-by-terraform-aws) explained how to solve the exact problem I had.

Essentially, I wrote a script in [MIME multipart format](https://www.rfc-editor.org/rfc/rfc2388.html) for our launch template. The launch template is run when an instance is assigned to our cluster by AWS. The customized commands in the script then start up Kubelet and register the node with our cluster. Unfortunately, I ran into a snag, so you can see how desperate I became while debugging below.

{{<code language="bash" connotation="bad" title="Desperately outputting to debug files">}}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="/:/+++"
--/:/+++
Content-Type: text/x-shellscript; charset="us-ascii"
#!/bin/bash

sudo su
mkdir -p /var/log/chris_kubelet_test
ps aux | grep kubelet &> /var/log/chris_kubelet_test/ps_aux_before.log

/etc/eks/bootstrap.sh "${cluster_name}" \
  --kubelet-extra-args "${kubelet_extra_args}" \
  --apiserver-endpoint "${cluster_endpoint}" \
  --b64-cluster-ca "${certificate_authority_data}" \
  ${bootstrap_extra_args} &> /var/log/chris_kubelet_test/bootstrap_output.log

echo "$(date)" > /var/log/chris_kubelet_test/bootstrap_time.log
ps aux | grep kubelet &> /var/log/chris_kubelet_test/ps_aux_after.log
{{</code>}}

My debugging process was basically:

1. Replace managed node group in Terraform
2. SSH into any node (`kubectl get node`)
3. Check `ps aux | grep kubelet` to see if my extra args were in
4. Check `journalctl -u kubelet`
5. Add more debug files
6. Rinse and repeat 😭

By the end of this process, I narrowed down the problem but didn't know how to solve it.

- On the node, `ps aux | grep kubelet` would show the default args.
- On the node, `/var/log/chris_kubelet_test/ps_aux_after.log` would show that the extra args were "successfully" applied when the launch template was called.
- On the node, `journalctl -u kubelet` would show that Kubelet was started once, then a few seconds later, _something_ would stop Kubelet and restart it.

COOL. I had no idea what was going on, and so I took my findings to Wilson. I don't even think I finished saying "Something is restarting Kubelet and replacing my args" before Wilson interrupted with "Check `systemd`."

And off I went on this journey to look into `systemd`. Helpfully, he sent me a [video](https://youtu.be/UQXIdOb4Mzk), but I did not absorb anything, so he dutifully served as my sentient rubber duck.

{{<chat sender="me" position="right">}}
I tried running `systemctl stop kubelet`, and it got restarted even faster this time. :(
{{</chat>}}

{{<chat sender="Wilson" position="left">}}
No, `systemd` reads a config somewhere on health check. Did you find that file?
{{</chat>}}

Mentioning "that [configuration] file" jogged my memory, and I retrieved the code snippet I remembered seeing.

{{<code language="bash" options="linenostart=465" title="The relevant lines from the EKS [`bootstrap.sh`](https://github.com/awslabs/amazon-eks-ami/blob/c5a09beba2c4bdb8ac18a3eaa319685716368637/files/bootstrap.sh#L465-L470)">}}
if [[ -n "$KUBELET_EXTRA_ARGS" ]]; then
  cat << EOF > /etc/systemd/system/kubelet.service.d/30-kubelet-extra-args.conf
[Service]
Environment='KUBELET_EXTRA_ARGS=$KUBELET_EXTRA_ARGS'
EOF
fi
{{</code>}}

{{<chat sender="me" position="right">}}The problem though is that the `/etc/systemd/system/kubelet.service.d/30-kubelet-extra-args.conf` file exists already, and it has something else in it.

So, I'm going to guess that even if I do write my own args to that file, EKS is going to overwrite it again based on that script snippet.
{{</chat>}}

{{<chat sender="Wilson" position="left">}}
Yes, name your file 31.
{{</chat>}}

{{<chat sender="me" position="right">}}
🤯 omg, 30 has no meaning...
{{</chat>}}

Well, it's not that 30 has no meaning, but more that the file doesn't have to be named 30. In fact, what I learned was that `systemd` makes sure that particular programs are running with tht correct configurations. More specifically, those configurations have a certain precedence. And when Wilson said to "name [my] file 31," he was referring to the `systemd` documentation that states, "for options which accept just a single value, the entry in the file sorted last takes precedence."[^2]

Armed with that knowledge, my launch template just required a few more tweaks for my `userdata.tpl` file (passed through Terraform). Why do 31 when I can bump it straight up to 99?

{{<code language="bash" connotation="good" title="Launch template correctly using `systemd`">}}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="/:/+++"
--/:/+++
Content-Type: text/x-shellscript; charset="us-ascii"
#!/bin/bash

sudo su

%{ if length(kubelet_extra_args) > 0 }
export KUBELET_EXTRA_ARGS="${kubelet_extra_args}"

cat <<EOF > /etc/systemd/system/kubelet.service.d/99-kubelet-extra-args.conf
[Service]
Environment='KUBELET_EXTRA_ARGS=${kubelet_extra_args}'
EOF

/etc/eks/bootstrap.sh "${cluster_name}" \
  --kubelet-extra-args "${kubelet_extra_args}" \
  --apiserver-endpoint "${cluster_endpoint}" \
  --b64-cluster-ca "${certificate_authority_data}" \
  --use-max-pods false

%{ endif }
{{</code>}}

The final key to the puzzle was fixing security groups, but following Amazon's recommendations for [EKS security group settings](https://docs.aws.amazon.com/eks/latest/userguide/sec-group-reqs.html) worked out. It's probably by design that debug statements are vague and only tell you the symptom of the problem (obfuscation of the reason to give more security), but as someone who was trying to set things up and could only tell that nodes and pods were having trouble communicating with each other, UGH.

And then it worked! Everything just worked! 🎉🎉🎉 Outages are much rarer now.

Also hindsight is 20/20, but I realize now that if I had just searched up what `journalctl` even is, I'd find out that it's `systemd`'s logger. 🤦🏻‍♀️

> **NOTE** \
> Imagine my surprise when, after spending a few days looking into launch templates, I find [this EKS issue](https://github.com/awslabs/amazon-eks-ami/issues/318) about copying GKE's Kubelet Extra Args. GKE just does it by default, but EKS doesn't. 🙃 And that's why I had to add the launch template myself.

### so, what exactly is kubernetes?

Now that I've gone through this ordeal, here's how I understand Kubernetes with an emphasis on what's important to me:

* [Nodes](https://kubernetes.io/docs/concepts/architecture/nodes/) are machines (physical or virtual) with hard limits on resources.
* [Kubelet](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/) runs on the machine and registers the machine (=node) with the cluster.
* [Pods](https://kubernetes.io/docs/concepts/workloads/pods/) are the smallest abstraction in Kubernetes. Pods run containers that use up machine resources.
* [Services](https://kubernetes.io/docs/concepts/services-networking/service/) are a logical resource that allow discoverability of pods.
* [Ingresses](https://kubernetes.io/docs/concepts/services-networking/ingress/) are rules to make internal endpoints externally reachable.
* Deployments, replicasets, daemonsets, batchjobs, jobs, etc. are resources that manage pod lifecycles (e.g. how many, when, where, what happens on restarts or crashing)
* You can make custom resources (like Knative does).

And the Cloud Native Computing Foundation (CNCF) provides [The Illustrated Children's Guide to Kubernetes](https://www.cncf.io/phippy/the-childrens-illustrated-guide-to-kubernetes/).

## acknowledgments

A big thank you to [Wilson Husin](https://github.com/wilsonehusin) for teaching me about Kubernetes and everything needed to get an end-to-end site up and running. Thank you for bearing with all the smooth-brained and frustrating conversations with me. 🙏

Thank you for proofreading my post and providing feedback!
* [Sam Farid](https://github.com/holosam)
* [Wilson Husin](https://github.com/wilsonehusin)
* [Roger Lee](https://github.com/rogerjxlee)
* [Fernando Padilla](https://github.com/rpfernando)

[^1]: EKS has no automatic node health repair. https://aws.amazon.com/premiumsupport/knowledge-center/eks-node-status-ready/
[^2]: [`man systemd-system.conf`](https://man7.org/linux/man-pages/man5/systemd-system.conf.5.html#CONFIGURATION_DIRECTORIES_AND_PRECEDENCE)

