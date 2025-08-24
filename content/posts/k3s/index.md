+++
title = "This is your sign to give up and just use k3s for smaller projects"
description = "Self-managing a single-node Kubernetes deployment with k3s is probably the least painful way of deploying small projects that might not (ever) be profitable."
date = 2025-08-24

[taxonomies]
categories = ["kubernetes", "web", "infrastructure", "rant"]

[extra]
featured = true
+++

It has never been **easier** to ship something. Heroku walked[^1] so that Vercel, Render, Fly.io and dozens of others could run. Point us to a Git repo, give us your credit card number, and we'll take care of the rest, they say. You want a database? No problem, here's our special sauce SDK, just `npm install` it. Object storage? Same thing, just call out to this function and we'll take care of it.

{% speechbubble(avatar_url="/icon@2x.png", avatar_alt="crescentrose's avatar") %}
and how much will this cost me
{% end %}

{% speechbubble(response=true, avatar_url="vercel.png", avatar_alt="vercel logo") %}
lmao
{% end %}
{% speechbubble(response=true, doubletext=true, avatar_url="vercel.png", avatar_alt="vercel logo") %}
don't worry about it babe
{% end %}

{% speechbubble(avatar_url="/icon@2x.png", avatar_alt="crescentrose's avatar") %}
okay 💗
{% end %}
{% speechbubble(avatar_url="/icon@2x.png", avatar_alt="crescentrose's avatar", doubletext=true) %}
yay 💗
{% end %}


It has also never been **cheaper** to rent a cloud machine. The thrifty titan Hetzner will rent you a 2vCPU/2GB VM for 4.35€/month, or even less if you're willing to go for Intel or Arm CPUs. For less than a cost of a fancy cup of coffee, you too could experience the joys of being a good old-fashioned sysadmin: figuring out nginx rules live in production, and praying that the automated backup worked when you fuck up your database.

Finally, we've never had more **power** when it comes to deploying projects. Microsoft, Google and Amazon offer a truly mind-boggling amount of services. Public clouds let you build sprawling, complex infrastructure that will be able to handle just about anything you throw at it, as long as, of course, you can afford it - both financially, and time-wise.

All three of these options have their strengths. For the burgeoning start-up flush with investor cash, going with a cloud platform like Vercel is probably quite smart. If you want customizability and options, everyone's already on AWS, Azure or GCP. And if you're just working on something for fun or can't afford the niceties of cloud platforms, well, you can always go with the cheap option.

## Well, doesn't that kind of suck?

In the end, we all want the same things. Point to a Docker image and run it. Do that automatically on `git push`. Run a few cron jobs. Maybe run a background processing queue. Stop Updates when an issue is encountered without downtime. Keep your infrastructure as code for easy rebuilding. Scaling up as easily as scaling down. As little maintenance as possible.

Cloud platforms got that shit on lockdown. You'll get everything with a cherry on top. But, that has a price, and this price becomes exponentially unjustifiable for non-profitable or barely-profitable projects. Your only choice remains a thrifty VPS you customize yourself. If you're like me, that involved setting up a hodgepodge of Ansible playbooks, `systemd` units and Bash scripts on a VM, manually managing certain aspects of the system and patching up breakages when they happen. Inevitably there would be a new Ubuntu LTS release and I'd dread upgrading because of all the state that has accumulated in the system. Or I'd want to add a new feature like automatic deployments from GitHub Actions runs, only to realize I'd have to code it up from scratch.

I want to live in a world where good engineering practices are accessible to all projects. So, if you're unable to pay a lot of money for a managed cloud deployment, but also want to be aligned as close as possible to current best practices, what are you to do?

In my humble opinion, running a single-node Kubernetes cluster is currently the correct way to achieve this. This might sound scary, overkill, or expensive, but it's easier and cheaper than it sounds thanks to projects like [k3s](https://k3s.io).

K3s is a simple, small, batteries-included Kubernetes distribution designed for small-scale deployments. It's perfect for single-node clusters but can be scaled up if required. As it is a fully compliant Kubernetes distribution, you can graduate to big-boy Kubernetes whenever you are ready to add a few zeroes to the end of your cloud bill while keeping the exact same definitions you accumulated thus far. And you can get the same power, customizability and support as you would from the major cloud platforms with the cost of a thrifty VPS provider.

## Making my peace with Kubernetes

I've been a very productive Kubernetes hater for most of my engineering career. Too complex, bloated, expensive, C++ of deployment solutions that most places did not need and were cargo-culted into. However, things changed.

Most of the industry standardized on Kubernetes as the _de facto_ deployment solution. Finding resources for it became easier. Critically for my use case, we got distributions like the aforementioned k3s that allow for easy single-node deployments without worrying about picking a "container network interface plugin" or other arcane details. As a cornerstone of the industry, it had more eyes on it looking out for bugs and security issues than any of my deployment solutions could ever have.

In the end I realized that, with my jumble of custom scripts and workflows, [dear friend, I have built a (worse) Kubernetes](https://www.macchaffee.com/blog/2024/you-have-built-a-kubernetes/). Slowly my feelings towards Kubernetes went from passive resentment to begrudging acceptance, with a hint of occasional muted enthusiasm.

You might think that Kubernetes is too complicated for you, and you might not understand how it works. I'm here to tell you that the _basics_ are surprisingly not that complex, and you can get the grasp of it very quickly. Those skills will, in turn, last you much longer than experience in a proprietary walled garden - while platforms like Vercel et al. provide a valuable service, it's still just _their_ service. Throughout the past 12 or so years of writing code for money, I've never regretted investing time into learning how to work with standard, open-source solutions. Even my knowledge of 2013-era PHP still pays occasional (thankfully very rare) dividends, and the same cannot be said for those who honed their craft in the proprietary hotness of the day.

## Kubernetes still has parts that objectively suck

While I think YAML gets too much hate[^2], it's very clearly not the best format for sprawling config files that Kubernetes expects. I wanted to avoid writing YAML as much as possible.

A very popular piece of kit in the Kubernetes ecosystem is Helm, the de-facto package manager for Kubernetes. Well, I **especially** wanted to avoid writing Helm templates. The Go templating language is already quite painful, and having to think about how many tab stops I want to indent a certain block before passing it to a `nindent` filter would probably drive me towards drug abuse. For now, I went with Terraform for managing my cluster, although there is a lot of repetition in those files and I'm looking into something like [cdk8s](https://cdk8s.io/) that would let me just write a couple of TypeScript files instead.

You can, of course, still use Helm to a degree - you don't need to package your own software to make use of the existing packages, and you can apply customizations to already deployed Helm charts easily as well. I mean, I'm not the boss of you, you can also package your apps as Helm charts if that's what your heart desires, I'm just saying what worked for me.

Kubernetes also has a **lot** of features, and it's very easy to get lost in them. Many of them are conflicting or interact in unexpected ways - for example, you can define your routes as `Ingress` resources, but if you set up Træfik for your reverse proxy needs you can also use their custom [`IngressRoute`](https://doc.traefik.io/traefik/reference/routing-configuration/kubernetes/crd/http/ingressroute/) resources, which are going to be different from the [`Gateway`](https://kubernetes.io/docs/concepts/services-networking/gateway/) resources even though they all essentially do the same thing. I strongly suggest choosing one way of doing something (e.g. `Ingress` for routing) and sticking to it. [The haters guide to Kubernetes](https://paulbutler.org/2024/the-haters-guide-to-kubernetes/) has a lot of good pointers on what to avoid to keep complexity to a minimum.

## Kubernetes is bad for long-term data

Kubernetes is really not the correct option for anything you want to keep long-term, such as databases or user uploads. If you have any data you remotely care about, please just pay $10 - $20 for a managed database, or a couple of bucks for S3-compatible object storage. It's a massive value add, and an incredible weight off the shoulders, to be able to tear down and rebuild your Kubernetes cluster without worrying about your data.

It is theoretically possible to host Postgres or another RDBMS in Kubernetes, or to use local storage providers, but I don't know of anyone sane who's doing that. I guess you could do it if you're incredibly strapped for cash, don't host anything of value, and make backups with religious fervor.

## In practice

[Thronebutt.com](https://thronebutt.com), my side project that works as a back-end for Vlambeer's 2015 roguelike [Nuclear Throne](https://store.steampowered.com/app/242680/Nuclear_Throne/), has been running on this set-up for the past couple of weeks with about 20k daily requests. It's hardly a critical or a frequented service, and the game is well past its heyday. But it makes people happy. And, more importantly, we owe it to the people who bought the game with the promise of daily and weekly runs to keep it up for as long as we can in as good of a shape as we can.

Previously, Thronebutt had been running on DigitalOcean's App Platform. We paid for two "apps" (backend and frontend), a managed database, and the additional cost of build jobs which were billed separately per-minute. Since DigitalOcean App Platform requires HTTPS, and the game can run on certain older consoles where it does not handle modern TLS well, I also had to deploy and maintain a small VPS to serve as the world's first "https to http downgrade" service. In total, this was regularly around $55/month.

Migrating to k3s on a VPS, while retaining the managed database, more than halved the price to about $25 while making better use of the limited resources we have, reducing the amount of managed systems to just two, and avoiding the fears of a sudden traffic spike sucking up the pittance of a bandwidth allowance that App Platform provides. Additionally, the entire deployment can be rebuilt on any cloud provider within a few minutes and with two Terraform commands, which gives me a lot of confidence that switching to a different cloud provider, if necessary, would be easy.

I was thinking of open-sourcing the entire thing as a module, but it would feel pretty pompous and self-congratulatory to do that when it's as simple as a handful of lines of Terraform and a shell script to fetch the configuration file necessary to connect to the cluster via `kubectl`. However, I'm thinking of putting it a bit more effort into it when I have some extra time and producing a "starter kit" which would make it as simple as, let's say, setting up a GitHub Action. I am unfortunately very busy for the next couple of weeks at work and with other things, so that will have to wait a bit. In the meantime, [this gist will have to be enough to show the proof of concept](https://gist.github.com/crescentrose/5d82d2a2732ef257aeb55393fb24e08f).

## Alternatives

There are alternatives to k3s in the form of [microk8s](https://microk8s.io) and [minikube](https://minikube.sigs.k8s.io). The reason why I went with k3s is that it's least resource intensive out of them and has the best out-of-the-box experience. Additionally I had issues getting microk8s to respond to HTTP requests originating from outside `localhost`. But all three options should provide a reasonably similar experience.

There are also a lot of alternatives that do not include Kubernetes at all. I've previously used the Heroku-like [dokku](https://dokku.com) and had reasonably good experiences with it. I have also heard good things of [Dokploy](https://dokploy.com). Both of those, however, suffer from the issue of turning you into a sysadmin of a long running machine. With k3s, I can simply tear down and rebuild my cluster on top of a new OS image. There's also a clearer path to scaling up, which may or may not be important to you.

I'd be remiss not to include 37signals' own [Kamal](https://kamal-deploy.org), which promises to give you zero-downtime deploys with just a handful of commands. If you _only_ need to run a couple of Docker images with a relatively basic setup, then I imagine this is a fine solution, especially for Rails apps that will benefit from the additional integration Kamal gives them.

[^1]: or, I guess, stumbled
[^2]: The choice of YAML for Kubernetes is truly baffling given the types of data it operates on and I would love to learn more about the historical context of that decision because there must have been a very solid argument to go for YAML which I am not seeing. However, it is not a _bad_ format for certain types of data structures. Also, in the past five or so years, the YAML parsing situation improved significantly, and most parsers now at least tell you outright where the footguns are and which levers to pull to disable them.
