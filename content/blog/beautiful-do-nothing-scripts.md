---
title: beautiful do-nothing scripts
date: 2024-03-27
mermaid: true
readingtime: true
toc: true
cover: /img/do-nothing/04b-confirm.png
tags:
  - automation
  - reliability
---

> NOTE: I got permission to post this. :)

I want to show off demo screenshots and code snippets from a do-nothing script I wrote last year. 🥺

## motivation

Three things happened last year:

- My teammate automated our prod release through GitHub Actions, but the release still needed to be manually triggered with non-trivial input selection.
- I read Dan Slimmon's post titled "Do-nothing scripting: the key to gradual automation."[^1]
- I heard about [`charmbracelet`](https://github.com/charmbracelet), a company striving to make the command line beautiful with an aesthetic I absolutely adore.

I had a process I wanted to automate, a methodology to make that process better, and a tool to make the automation beautiful and easy-to-use.

## but first, what's a do-nothing script?

For tasks that are merely a checkbox but require absolute attention and minimal reward, Dan Slimmon defines a do-nothing script to semi-automate them away:[^1]

> A do-nothing script is a script that encodes the instructions of a slog, encapsulating each step in a function.

My favorite part of these scripts is the low activation threshold. Jumping from nothing to everything can be difficult, but this type of script introduces the concept of taking incremental steps to make even the largest problems simpler to tackle.

In this case, I wanted to use the do-nothing script to make the undocumented steps explicit. There was a specific set of commands we needed to run every time, but each invocation required extra brainpower to remember what they were. Since the do-nothing script wouldn't actually, well, _do anything_ (just list out what needs to be done), the risk was also low.

## the non-trivial production release checklist

My team has a weekly rotation where the person on duty handles interrupts-driven tasks such as triaging alerts, releasing prod, and filing quality assurance issues.

For every prod release, the person on interrupts would have to craft and run at most three sets of make commands. The order of operations generally looked like the following:

1. Go to our GitHub repo or look at the git tags to see what the last release number was
2. Go to GitHub and open a compare window between the last release tag and main
3. Check the code to see what needs to be released (pick the 3 sets that need to be released)
4. Go to GitHub and pick a commit that succeeded the Dev Deploy action workflow
5. Scroll through Slack channel to find the commands that were run last time
6. Paste into a notepad and edit with the appropriate input
7. Paste into Slack channel
8. Run the commands
9. Make sure nothing breaks
10. Handle quality checks

Steps 1-6 are very much **toil**, according to the Google Site Reliability Engineering book[^2], or **slog**, according to Dan Slimmon.[^1]

In this checklist, some steps are much more important, but too much brain energy has already been spent by the time we get there. Steps 1-6 are semi-automatable but require the human running the commands to be careful. In a pinch (e.g. an active outage that requires a hotfix and a prod release), the release process would be prime for errors. Step 6 would be especially problematic since it requires manual editing of the command. By the time we get to steps 9 and 10, some mental exhaustion has set in.

And since this prod release situation is very well-defined and super repetitive... I wrote a do-nothing script!

## the do-nothing script demo

The goal of the script was to decrease the time and energy spent on steps 1-6 from the checklist above without modifying any state. It just aggregates a bunch of information and systematically formats and gives clear instructions for the user to manually run.

I wanted this script to be stupid easy to use, so I aliased the script to `make ez`. Fewer keystrokes, less memorization. 👉😜👉

I chose the scrappiest and easiest path because this script was for a team of 6 engineers at a seed-stage startup. We needed something easy to use and also easy to undo. Keep in mind that what worked for me may not work for you.

### introduction

Since the interrupts rotation is on a weekly cycle, the person on duty may not have interacted with this script in over a month. The introduction section dumps all the necessary information up front. The great thing is that since nothing is being modified, the user can run the script as many times as they like.

Now we already know:

- when was the last release
- what was the last release
- what has changed since the last release

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/01-intro.png" alt="A screenshot of a terminal window showing the output of a command 'make ez'. This is the 'do nothing' script for prod releases. By the end of this script, you will have a cookie cutter message you can paste into the #deploys-prod channel containing all the commands you you need to manually run. First let's make sure your git state is up-to-date... OK, git fetch done. And now let's begin. Here's the current stae of affairs. The next section shows the current semantic version of the prod release, the latest commit SHA and time, the release tag link to GitHub, and the compare link to GitHub." />
</center>
{{</rawhtml>}}

### input selection

Once the information is dumped, the user can begin to select the information needed to form the commands.

First, there were up to three sets of commands that need to be run. If we don't need to run something, we don't need to think about it.

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/02a-question.png" alt="Screenshot of a terminal window. Three magenta question marks before the question 'What are you planning to release?' The help menu is in grey below the question: arrow keys for nav, space for select, enter for submit. Three options are not selected, but the cursor is on Servers (backend). Two other options include Tower (client and Urania (frontend)." />
</center>
{{</rawhtml>}}

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/02b-confirm.png" alt="Screenshot of a terminal window. Three magenta question marks before the question 'What are you planning to release?' Below the question is an OK in green saying Choices confirmed. Only Servers (backend) has a thumbs up next to it. The other two options, Tower (client) and Urania (frontend), have a minus sign emoji next to them." />
</center>
{{</rawhtml>}}

Second, we need to know which commit to deploy. An implicit requirement from how we set up our automation is that a particular GitHub action **must** have completed already (Dev Deploy). So instead of making the user find out later when the prod release fails, this script filters out commits that would not have qualified anyways.

The commit messages here have been redacted, but the user would be able to see both the SHA and the associated message.

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/03a-select.png" alt="Screenshot of a terminal window. Three magenta question marks before the question ''Which commit for our Servers (backend) should be deployed? Commits are sourced from successful Deploy Dev workflow runs. Order is in descending merge time (most recent is first).' Navigation help menu is in grey below the question. A pink selector is active with 10 commit SHAs with their commit messages to select from." />
</center>
{{</rawhtml>}}

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/03b-confirm.png" alt="??? Which commit for our Servers (backend) should be deployed? Commits are sourced from successful Deploy Dev workflow runs. Order is in descending merge time (most recent is first).' [OK] SHA selected. Servers (backend) will use SHA <sha>. The latest prod release is 0.0.104. This prod release will use 0.0.105." />
</center>
{{</rawhtml>}}

Finally, the script allows the user to put in a message. This step wasn't necessary, but I wanted the output of the script to require as little modification as possible. I've found that the script is easy enough to run that if I mess up a single step, rerunning the entire script again is easier than modifying the output.

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/04a-input.png" alt="??? Do you hvae anything you want to say about what you plan to release? Leaving this empty will use a default summary ('Pushing prod'). enter: submit | ctrl+c: use default summary. Flashing input with greyed out placeholder text: 'Pushing prod'" />
</center>
{{</rawhtml>}}

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/04b-confirm.png" alt="??? Do you hvae anything you want to say about what you plan to release? Leaving this empty will use a default summary ('Pushing prod'). [OK] Summary recorded. Using summary: > wheeee this is a demo" />
</center>
{{</rawhtml>}}

### output

What we get at the end is a set of instructions:

- copy the message
- paste it in a particular spot

The screenshots make it difficult to see the entire output, but the results from the previous questions are still persisted in the terminal, so the user can scroll back up to validate their answers.

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/05-copy.png" alt="INSTRUCTIONS Copy the section below to #deploys-prod channel. If you pipe the output to somewhere else, you may see an empty section. Remember you need to run these manually! COPY START :mega: wheeee this is a demo :computer: Servers `d60e72235` placeholder commit message here (Tue Mar 26 13:46:08 2024 -0700) make prod/promote-all GIT_SHA=sha RELEASE_VERSION=0.0.105 :heav_minus_sign: Not releasing Urania. :heavy_minus_sign: Not releasing the Tower."  />
</center>
{{</rawhtml>}}

{{<rawhtml>}}
<center>
  <img src="/img/do-nothing/06-paste.png" alt="A post in Slack. The message from the previous image is formatted correctly with code blocks and emojis."  />
</center>
{{</rawhtml>}}

## the new checklist post-script

Now the checklist from before has been shortened

1. Run `make ez` - Check the code to see what needs to be released, select inputs
2. Paste into slack channel
3. Run the commands
4. Make sure nothing breaks
5. Handle quality checks

Now all the time spent on this process is on quality checks.

## implementation

What I used

- Bash `#!/bin/bash`
- [`charmbracelet/gum`](https://github.com/charmbracelet/gum)
- `git`
- GitHub's command-line interface `gh`

A safer language like Go was an alternative, but I opted for speed of implementation at the time.

I'm not going to paste the entire script, but I'll show a few snippets that I enjoyed the most.

{{<code language="bash" title="It's so easy to print long formatted messages">}}
>&2 cat <<EOF
👋 This is the 'do nothing' script for prod releases.

By the end of this script, you will have a cookie cutter message you can paste into the #deploys-prod channel containing all the commands you need to manually run.

First let's make sure your git state is up-to-date...
EOF
{{</code>}}

{{<code language=bash title="Use existing tools like `gh` to get information I need">}}
# Get the SHA for the last 10 successful Deploy Dev workflows.
declare -a SHAS=($(gh --repo <org>/<repo> run list --workflow deploy_dev.yaml --json="conclusion,headSha,databaseId" --jq='limit(10; .[] | select(.conclusion == "success") | .headSha)'))
{{</code>}}

I installed `gum` by running `brew install gum`, but I could have managed the dependency with our Go toolchain as well since we have a separate tools `go.mod` file already.[^3]

{{<code language=bash title="Use `charmbracelet/gum` to read in user input with ease">}}
>&2 cat <<EOF
$(color_action "???") Which commit for our ${_DISPLAY_TITLE} should be deployed?
    Commits are sourced from successful Deploy Dev workflow runs.
    Order is in descending merge time (most recent is first).
EOF

_CHOSEN=$(echo $_CANDIDATES | gum choose --ordered --header="arrow keys: nav | enter: select & submit")
unset _CANDIDATES

BACKEND_SHA=$(echo $_CHOSEN | sed 's@ .*@@' | sed 's@"@@')
{{</code>}}

{{<code language=bash title="Use `awk` to increment semantic versioning">}}
LATEST_TAG=$(git ls-remote --tags origin | sed 's@.*\/v@v@' | sort -V -r | head -n1)
LATEST_SEM_VER=$(echo "${LATEST_TAG}" | sed 's@.*v@@')
...
# We only use the patch version, so easy for us to do in Bash.
NEXT_TAG=$(echo "${LATEST_SEM_VER}" | awk -F. -v OFS=. '{$NF += 1 ; print}')
{{</code>}}

{{<code language=bash title="Use functions to make it easier to handle complex calls">}}
# Usage: get_sha_and_msg <symbol>
get_sha_and_msg() {
  SHA=$(echo $1 | xargs)
  git log --graph --pretty=format:"\"%H %s\"" -1 --no-decorate $SHA | \
    awk '!/\.\.\./' | \
    sed 's@^\* @@' | \
    xargs -0
}
{{</code>}}

{{<code language=bash title="Use emojis and color to call out action items">}}
# Usage: pick_emoji "true"
pick_emoji() {
  if [ $1 == "true" ]; then
    echo "👍"
  else
    echo "➖"
  fi
}

color_action() {
  echo "${COLOR_MAGENTA}${STYLE_BOLD}${1}${COLOR_CLEAR}"
}
{{</code>}}

## conclusion

My teammates all use this script for their shifts! 😊

Since its initial inception, I incrementally added

- the initial `git fetch`
- the "state-of-the-world" section
- the "what do you want to say about this release" input

Each time it’s a matter of asking “is this a big enough problem to justify the amount of time it would take to solve?"

In its current state, I spend no mental energy on the prod release itself, and my team feels empowered to release whenever they want. We went from spending probably an average of 10 minutes per release to 2 minutes per release. This is not counting when we forgot and had to start pinging each other to check if we're running the correct commands.

One day we may have too many microservices for a simple do-nothing script, or we end up with multiple teams each managing their own set of binaries, or we fully automate prod releases by adding end-to-end data quality checks that block a release. That’s all ok! The whole point of the do nothing script is to be semi-automated documentation that is benefitting us now. Until this little script’s watch has ended, it will continue to chug along and save us time.

[^1]: "Do-nothing scripting: the key to gradual automation" by Dan Slimmon. <https://blog.danslimmon.com/2019/07/15/do-nothing-scripting-the-key-to-gradual-automation/>
[^2]: "Site Reliability Engineering: How Google Runs Production Systems" - Chapter 6 - "Eliminating Toil" <https://sre.google/workbook/eliminating-toil/>
[^3]: "Using Go toolchain to manage binary dependencies" by Wilson Husin. <https://husin.dev/go-binary-tools/>
