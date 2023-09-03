---
title: hugo layouts & partials & shortcodes
date: 2023-09-03
mermaid: true
readingtime: true
tags:
  - css
  - hugo
  - partials
  - layouts
  - shortcodes
  - webdev
---

My [first published commit](https://github.com/chrisyxlee/nichijou/commit/d347ff9c7d39d8cf1876d05edb357c7eda5fc001) for this site was over a year ago on June 8, 2022! I've attempted to maintain a personal site at least a few times now, but none of them stuck with me as much as Hugo. The main things that drew me to Hugo were:

* a nice theme I wanted to use ([`panr/hugo-theme-terminal`](https://github.com/panr/hugo-theme-terminal))[^1]
* content generated primarily from markdown[^3]
* easy incremental additions to the site

[^1]: In my past attempts at maintaining a personal website, I usually got stuck on the first step (usually involving too much CSS or HTML I had to handroll myself). Starting with a theme was nice so that I could incrementally learn Hugo and CSS.
[^3]: Most documentation and tasks I write for work are in [markdown](https://en.wikipedia.org/wiki/Markdown), so it has become natural for me to write my thoughts out in markdown.

Recently, I added the [`pics`](/pics) page, which triggered a ton of learnings about Hugo and CSS. The page wouldn't have been possible without multiple CSS debugging sessions with [Wilson Husin](https://husin.dev) and dozens of queries to ChatGPT. I started off just wanting a page to show images I liked, but now I have a much better understanding of Hugo, flex boxes, and relative positioning.

This post is primarily about my learnings about Hugo. As with most things, the easiest way for me to learn about something is through trial by fire. To anchor this post around something concrete, I'll primarily focus on the differences between the blog and the pics pages.

{{<rawhtml>}}
<center>
  <img src="/img/blog_list.png" alt="Screenshot of my blog list view, which has a bullet-point list of each point divided by year." style="max-width:800px; width: 80vw; box-shadow: 0px 0px 16px rgba(0, 0, 0, 0.2);"/>
</center>
{{</rawhtml>}}
{{<figure id="1">}}
Screenshot of my [blog](/blog) list view.
{{</figure>}}

{{<rawhtml>}}
<center>
  <img src="/img/pics_list.png" alt="Screenshot of my pics list view, which has square images spanning the entire width." style="max-width:800px; width: 80vw; box-shadow: 0px 0px 16px rgba(0, 0, 0, 0.2); " />
</center>
{{</rawhtml>}}
{{<figure id="2">}}
Screenshot of my [pics](/pics) list view.
{{</figure>}}

## use layouts to show different styles of pages

The easiest way to illustrate this concept is through my commits:

* ❌ [`727c5d`](https://github.com/chrisyxlee/nichijou/commit/727c5d74a402a5e487b5bafa893d9c6d1e61f680) where I used a nested if within the same template because I wanted to redirect all pic posts to the 404 page.

* ✅ [`306d50`](https://github.com/chrisyxlee/nichijou/commit/306d5084a9b2de565abf514492622e834f07bf40) where I split the `list.html` template into what I wanted for the blog list and pics list -- and I named the commit message "wow i understand themes now"

* ✅ [`2dcc5e`](https://github.com/chrisyxlee/nichijou/commit/2dcc5ef9c98b36b54a76644de428c4dfadb9cf1f) where I split the `single.html` template into just the new part (for pics), which made the logic must simpler and easier to follow.

Even more explicitly, I took advantage of Hugo's [ordering for template lookup](https://gohugo.io/templates/views/#which-template-will-be-rendered). One can also add [`type`](https://gohugo.io/content-management/front-matter/) to the YAML front matter if the [default type of the post](https://gohugo.io/content-management/types/) (I used directory separation for the types) doesn't match the layout name.[^2]

[^2]: These are great resources for using Hugo (like the [entire list of how all lookup ordering works](https://gohugo.io/templates/lookup-order/)), but when I first started, I was absolutely not familiar with any of the terminology that Hugo used for each part. So, a lot of these resources were found after-the-fact.

My directory structure ([explore here](https://github.com/chrisyxlee/nichijou/tree/10a535ca840f81031f49207470454d87cfef5c1c/layouts/)) ended up being:

{{<code language="bash" connotation="neutral" title="Layout directory structure" lineNos="false">}}
$ tree ./layouts/_default ./layouts/blog ./layouts/pics ./themes/terminal/layouts/_default

./layouts/_default
├── term.html
└── terms.html
./layouts/blog
└── list.html
./layouts/pics
├── list.html
└── single.html
./themes/terminal/layouts/_default
├── baseof.html
├── index.html
├── list.html
├── rss.xml
├── single.html
├── term.html
└── terms.html
{{</code>}}

Clicking on the navigation links at the top will show a page using the `list.html` template.

* Lookup order for pics
  * 👉 layouts/pics/list.html does exist
* Lookup order for blog
  * 👉 layouts/blog/list.html does exist

Clicking a specific post will use the single.html template.

* Lookup order for pics
  * 👉 layouts/pics/single.html does exist
* Lookup order for blog
  * 🙅‍♀️ layouts/blogs/single.html doesn't exist
  * 🙅‍♀️ layouts/_default/single.html doesn't exist
  * 🙅‍♀️ layouts/themes/terminal/blog/single.html doesn't exist
  * 👉 layouts/themes/terminal/_default/single.html does exist

## reusable components are partials, not shortcodes

When I first began, I didn't know anything about partials. That might be by design because the front page of [Hugo's marketing site](https://www.gohugo.io) only calls out shortcodes. It seemed to me that shortcodes were the de-facto reusable component within Hugo.

{{<rawhtml>}}
<center>
  <img src="/img/hugo_shortcodes.png" alt="Screenshot of Hugo's front page calling out shortcodes. Hugo's shortcodes are markdown's superpower." style="max-width:600px; width: 80vw;"/>
</center>
{{</rawhtml>}}

So when I was writing my [ChatGPT is pretty cool](/blog/chatgpt_is_pretty_cool) post, I ran into an awkward situation where I was trying to call my `code` shortcode from my `chat` shortcode because I wanted to show that I was asking questions (therefore, a conversation) and also show that the responses contained code (therefore, a code block).

At the time, I found [this post](https://discourse.gohugo.io/t/programmatically-use-shortcode-inside-another-shortcodes-definition-file/11580/12) asking about programmatically calling shortcodes from shortcodes, which proved unhelpful since there was no mention of partials.

It turns out:

* [partials](https://gohugo.io/templates/partials/) are reusable components that can take an object and can be called from anywhere (except content)
* [shortcodes](https://gohugo.io/templates/shortcode-templates/) are reusable components that can take parameters, have inner bodies, and be embedded in content markdown

> *Aside* \
> [@jmooring](https://discourse.gohugo.io/u/jmooring)'s answers on Hugo's forums have been _super helpful_ for learning Hugo.

Posts like Jonathan Droege's [Head to Head: Shortcodes vs Partials in Hugo](https://jpdroege.com/blog/hugo-shortcodes-partials/) or [this question on Hugo's forum](https://discourse.gohugo.io/t/could-shortcodes-and-partials-be-unified/1348) ask why the two are different. It seems that partials and shortcodes have a historical and implementation-specific difference from [this answer](https://discourse.gohugo.io/t/could-shortcodes-and-partials-be-unified/1348/2).

Is this just not broadcasted widely enough? It seems like a common misconception for most people starting out on Hugo, myself included. ([1](https://discourse.gohugo.io/t/using-shortcodes-in-partials/45847), [2](https://stackoverflow.com/questions/55401755/use-shortcode-within-definition-of-shortcode), [3](https://discourse.gohugo.io/t/add-built-in-shortcodes-in-templates/19540))

The most practical find with partials was for using a generic paginator for paginating different slices depending on the page.

{{<code language="hugo" title="Using partials for pagination">}}
{{ $pager := .Paginate (where .Site.RegularPages "Type" "pics") }}
<div class="pics-list-container">
   <div class="pics-list">
      {{ range . }}
         {{ partial "pics/card.html" . }}
      {{ end }}
   </div>
</div>
{{ partial "paginator.html" $pager }}
{{</code>}}

For me, this also meant I could show pics in the same way as I do in the pics tab when listing all posts for a certain tag just by calling `{{ partial "pics/card.html" }}` again.

And since partials just take an object as parameter, I could add additional state for my blog entry partial.

{{<code language="hugo" title="Adding additional state to partial">}}
# layouts/blog/list.html
{{ partial "blog/entry.html" (dict "post" . "showYear" false) }}

---

# layouts/partials/blog/entry.html
{{ if not (isset . "showYear" )}}
   {{ errorf "'showYear' is required to use this partial %+v" . }}
{{ end }}
{{ if not (isset . "Page" )}}
   {{ errorf "'Page' is required to use this partial %+v" . }}
{{ end }}

{{ $showYear := .showYear }}
...
{{</code>}}

Meanwhile, shortcodes can take multiple parameters ([example](https://github.com/chrisyxlee/nichijou/blob/10a535ca840f81031f49207470454d87cfef5c1c/content/blog/kubernetes_the_fire_hose.md?plain=1#L210-L212)) which can be used from the shortcode itself ([example](https://github.com/chrisyxlee/nichijou/blob/main/layouts/shortcodes/code.html)). Unfortunately, I can't find a good way to embed the raw code for an example shortcode here without the formatting breaking.

## conclusion

It took me a while to get there, but reaching a deeper understanding of Hugo's building blocks made my code a lot easier to parse and understand, especially since I work on this site intermittently. With just these few concepts, I have a better understanding of how Hugo builds each page.
