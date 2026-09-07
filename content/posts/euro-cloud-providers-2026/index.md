+++
title = "The state of European cloud providers in 2026"
description = "Old man yells at cloud. The cloud yells back."
date = 2026-09-07 19:30:00

[taxonomies]
categories = ["cloud"]

[extra]
featured = true
+++

Recently I went on the hunt for a new server provider for my personal use. I have been getting on quite well with an old laptop shoved into my utility closet and Tailscale for some years now, but now there are some things I would like to be accessible outside my VPN. 

With the situation outside looking like it does, I figured it would be prudent to look for an European cloud provider. Plus, it is always nice to support the home team. The EU has been very loudly proclaiming the need for a "sovereign cloud" for quite some time now, so it will be interesting to see what progress has been made here. 

**The list below reflects my personal opinion and experiences. I attempted to be as accurate as I could be. However, keep in mind you are reading a random dude's ramblings online, so take them with an appropriately sized grain of salt.**

## The methodology

This will not be a serious and rigorous competition - I am just one guy with limited time, so the choices should reflect that. I will take a look at pricing, spin up a server, test out its CPU and network, and then assess how easy that was and what I got for my money. I will also take a cursory look at the rest of a platform's offerings to see how easy would it be to scale an app on it by adding things like object storage or a managed database. Last but not least, the management console (user interface) should work reliably and not shit itself during the most basic of operations.

Since getting one core of an Intel Atom is not the same as getting one core of a Threadripper[^1] even though they can both be billed as "1 vCPU", I will be looking at which _actual_ CPU is allocated to a VM, which will also give you some idea of the performance you can expect. In addition, I opted to run Geekbench on the servers as a quick way of getting across how powerful they are, relative to each other. Geekbench is a synthetic benchmark that is not necessarily representative of what you would run on a server and you have every right to clown on me for running it, but that would have been the case for any benchmark I opted for and at least Geekbench tell you roughly how much more (or less) one CPU can handle than another. Swap was added if necessary.

Besides the above, I also want to have hourly billing - I do not trust providers that want to lock you into a month (or longer) commitment without being able to trial the product. It is 2026: if you can provision a VM instantly, you can also decommission it instantly and prorate my subscription based on how much I actually used it.

Other things I am looking for are (sadly) an IPv4 allocation, and a reasonable traffic allotment that will not leave me holding the bag if a rogue OpenAI crawler gets stuck in an infinite loop.

I will try to evaluate two tiers: a **10€ budget** and a **20€ budget**. This is roughly the amount I consider expendable for a subscription. The _budget_ tier will feature the provider's "cost-conscious" lineup, usually with older, or straight up old, components. The _high-roller_ tier will feature the provider's standard line-up where possible, with the expectation that I will still get a shared CPU rather than dedicated resources. In practice both of these tiers can usually be specced up depending on whether you prefer multiple slower cores with more, but slower, RAM or fewer faster cores with less, but faster, RAM.

All prices are **excluding VAT** as VAT differs per country. Growing up means understanding Americans maybe had a point with this one. Lastly, no referral links will be provided.

## The competition

Before going into the EU clouds, here are some of the more known American providers for comparison.

**Vultr**: The *budget* option (1 vCPU, 2 GB RAM) will run you **8,60 €** per month. The *high-roller* option (2 vCPUs, 2 GB RAM) costs **15,48 €** per month. Vultr says the latter tier is for "high performance VMs" which are "powered by latest generation Intel Xeon CPUs or AMD EPYC CPUs", and what you _actually_ get is a 7 year old AMD EPYC processor.

**DigitalOcean**: The *budget* option (1 vCPU, 2 GB RAM) costs **10,32€** per month. If you want to splurge on the *high-roller* option (2 vCPUs, 2 GB RAM) will cost 18,06 € per month. DigitalOcean's _Premium AMD_ option is the same CPU as Vultr's and at a higher price, but at least they make no claims about its recency.

**RamNode**: For the *budget* option (1 vCPU / 2 GB RAM) you will only need to part with **2,58 €** per month, as long as you do not mind the lack of IPv4 connectivity. Even the *high-roller* (2 vCPUs / 2 GB RAM) option is affordable at 12,04 €. I could not test out what exact CPU this is because my registration to the "cloud portal" did not go through. 

**Google Cloud, Amazon Web Services, Azure**: Speaking from experience, one needs a doctorate in each to not shoot themselves in the foot, and differential equations to figure out the true cost of a service in advance. I actually rather enjoy building on Google Cloud, just not with my own money. The prices on all these platforms go vertical once you are out of the stingy free tiers.

I will also establish some sort of a baseline for Geekbench:

- My desktop PC, with an undervolted Ryzen 9 9900X[^2], [scores 3009 in single-core and 21030 in multi-core performance](https://browser.geekbench.com/v7/cpu/288324). 
- The Lenovo notebook I bought in 2020, which is currently my "home server", has a Ryzen 7 4700U which [scores 1570 in single-core and 5658 in multi-core](https://browser.geekbench.com/v6/cpu/19130134). I paid roughy 450€ for it, which comes out to around 6,25€ per month as of today.

With that out of the way we can get on to the list. I scoured several lists that showed up when searching for "european cloud providers", and in no particular order, here are...

## Hetzner 🇩🇪

The venerable thrifty German host that needs no introduction has seemingly ran into major capacity issues, seeing as the only "Cost-Optimized" VPS I can get is the base **CX23** configuration, 2 vCPU / 4 GB RAM / 40 GB SSD, only available in their Helsinki data centre. Together with an IPv4 allocation, this will run you roughly 6€ per month. For that price you can expect a somewhat sluggish Skylake-era (2015) Intel Xeon which scores [692 on single-core and 1262 on multi-core GeekBench](https://browser.geekbench.com/v7/cpu/288376).

For the *high-roller* version, I chose the **CPX22** configuration which offers 2 vCPUs / 4 GB RAM / 80 GB SSD, at 19,99 € per month. This might look similar to the above, but is a great example of how the vCPU number is misleading. CPX22 offers a fourth-gen AMD EPYC which is over twice as fast as the CPU in the budget machine. The Geekbench scores were [1701 for single-core and 3218 for multi-core](https://browser.geekbench.com/v7/cpu/288320)

Both instances were spun up almost instantly from Hetzner's serviceable UI. Both had a decently fast gigabit link and Hetzner's famously generous traffic allocation of 20 TB. Object storage is available for a base fee of 6,48 € per month, which does include 1TB of storage and 1TB of egress - this is pretty generous if you use it all, and a complete overkill if you do not.

## Hostinger 🇱🇹

Hostinger is a Lithuanian web host that has been around since 2004. It seems to primarily target small businesses that do not necessarily care about *where* something runs - think Wordpress hosting, email, managed WooCommerce and so on - but they do offer servers as well. 

The Hostinger website is a bit of a mess: frustratingly, I can not choose to display the website in one language and have the currency of another region even though *they clearly support both*, so I had to struggle through with my subpar Dutch, all while swatting away a persistent "agent" chatbox. By default, you are purchasing a two-year commitment up-front: their **KVM 2** plan (2 vCPUs / 8 GB RAM / 100 GB NVMe SSD) will run you 191,76 €. During checkout you can instead commit to a monthly plan - for this machine that would be 21,99 €, although you do get your first month for 9,99 €. 

As there is no option to trial the service with hourly billing, I did not proceed with purchasing it. (This will be a common occurrence, so get used to it.)

## OVH 🇫🇷

OVH is another company that needs no introduction - the Carrefour to Hetzner's Aldi, it is one of the primary torchbearers of the European cloud. OVH offers many choices for compute, running containers, databases, a data and AI/ML platform, and even actual quantum computers (with eye-watering prices). 

OVH has two ways to get a VM on their infrastructure. First, the VPS offer - 8,49€ per month gets you a 4 vCPU / 8 GB RAM / 75 GB NVMe SSD instance on a monthly commitment, and you can whittle that down to 7,21€ per month if you pay for a year up-front. The other option is to create a *cloud project*, which gives you the interface you might expect from a public cloud provider. Unfortunately these are significantly pricier: the **d2-2** box (1 vCPU / 2 GB RAM / 25 GB SSD) runs you 5,71€ per month, while the **d2-4** box (2 vCPU / 4 GB RAM / 50 GB SSD) costs 11,44€. As those are billed per hour, I decided to try them out.

After going through the effort of setting up a project and customizing an instance, I was delivered to a "your instance is being created" spinner. It spun for about 10 minutes, then reloaded the page, and then it happily informed me that ... I have not created any instances. Perhaps OVH takes its lunch time very seriously? Either way, I clearly was not getting my VM.

The next 20 minutes of my life were spent trying to delete the "vRack" that was created for me, which is the one thing preventing me from removing my payment method from OVH and closing my account - I do not even know how much this service I never signed up for costs, yet any attempt to remove it resulted in an internal server error. I took some screenshots in case I needed to get Amex to reverse a transaction. I guess I should not expect more from a company whose data centres were at some point built of [literal shipping containers](https://www.reuters.com/world/blaze-destroys-servers-europes-largest-cloud-services-firm-2021-03-10/).

## Scaleway 🇫🇷

Scaleway is another French cloud provider with a large range of products: plain old servers, GPUs, storage, container runtime, serverless functions, databases, data warehouses, IAM, and quantum compute as well. Their offer of development instances seems very competitive, and what particularly caught my eye was a 1 vCPU / 1 GB RAM instance (**STARDUST1-S**) for only 0,43 € per month, which seemed great for quick experiments or tests.

I would have loved to test out Scaleway's offer. Unfortunately when I tried to sign up, I never got a confirmation code that was supposedly sent to my Dutch phone number, so I could not pass the mandatory phone verification. Retrying by pushing the "send code" button again after a few minutes just popped up a toast message telling me I am trying too much[^5]. Perhaps Scaleway takes its Sundays very seriously? This marked the end of my Scaleway experiment.

## UpCloud 🇫🇮

UpCloud is a Finnish cloud provider that I can find very little information about outside their own website. I immediately liked that each page on their website features one of their employees in bisexual lighting[^6], rather than the first result of looking up "synergy" on Google Images. I know it is propaganda, and yet it is also sweet.

They offer a range of *Starter* servers with "previous-gen AMD CPUs", as well as *Premium* and *Cloud Native* (meaning, no local storage) instances with "premium AMD CPUs". Besides that they have the usual smattering of basic cloud services like object storage, managed databases, GPUs, Kubernetes and load balancers. Signing up was fast and easy, and soon I was dropped into a pleasant console, where I was informed I have a whooping 500 € to spend over the course of two weeks on trialing the platform.[^3]

For the _budget_ variant I went with the 10€ **Starter** instance (1 vCPU / 4 GB RAM / 30 GB SSD), which was available in all of their data centres and runs on an AMD EPYC 7542 from 2019. This tier limits you to 250Mbit/s of bandwidth, although in my testing I managed to very much exceed this without even trying. The [single-core Geekbench score](https://browser.geekbench.com/v7/cpu/291436) sat comfortably between the two Hetzner servers at 1287, as I would expect of the pricier option.

The _high roller_ variant was a 16€ **Premium** instance (2 vCPU / 2 GB RAM / 50 GB SSD), also available in all of their data centres. This gives you a slice of an AMD EPYC 9575F, which is built on AMD's latest Zen 5 architecture, and gigabit bandwidth. Geekbench returned a [respectable single-core score of 2153 and a multi-core score of 2610](https://browser.geekbench.com/v7/cpu/291472) (with a 4GB swapfile).

I think the sweet spot for UpCloud is probably the 12€/month Starter tier that doubles your bandwidth and gives you another CPU core for just 2€ more. While that is double the price of Hetzner's cheaper offer, it has the distinct benefit of being actually available, and the CPUs you get are significantly newer and faster. The premium offer, while offering the fastest and newest CPU on this test, suffers a lot from the DDR5 RAM shortage and the ballooning prices.

Another positive aspect is their network use policy - if you exceed your egress allotment you will not be cut off, your bandwidth will simply be reduced to 100Mbit for the month until you work out the situation with them. So, no surprise bills or cutoffs, which I really appreciate.

## Leafcloud 🇳🇱

Leafcloud is a Dutch start-up that prides itself on its eco-friendliness. According to their website, the excess heat generated by its data centres is being re-used to heat water in Amsterdam's buildings, and they [claim](https://leaf.cloud/truly-green) that this process is net-negative for CO2 emissions. In fact, the term "data centre" is doing some lifting here as they claim their servers are actually installed in buildings that will then use the generated heat, which also makes the entire thing less centralized and more efficient from the perspective of space usage. This is an extremely interesting and praiseworthy concept.[^4]

Signing up requires a 2€ deposit, or 25€ if you intend to use GPUs, which you can then immediately use on compute. According to their website, VMs are all built with AMD EPYC 9755 CPUs with DDR5 RAM and NVMe SSDs. As the CPUs are supposed to be the same *(foreshadowing!)*, I will only be testing the 4GB variant of **en1.small** which comes in at 18,56 € per month. You can also opt for the 2GB variant for 9,28 € per month. Storage is extra, at €0.096 per GB per month (so a 20 GB volume will cost you about 2 €). Also, egress traffic is only free up until 100 GB per month, after which you will be charged "€Fair use".

Giving it a spin through the rather arcane but reliable OpenStack UI, I was surprised to find that IPv6 is not available, and that the network seems to cap out at about 500Mbit/s for this instance. `lscpu` gave me a real shocker, though - rather than the alleged 9755, my instance was running on an AMD EPYC 7742, a CPU that is six years older. Now, that is still a solid CPU and it actually beats Hetzner's pricier offering in single-core performance [with a 1849 single-core score](https://browser.geekbench.com/v7/cpu/291894). However, it is a bad look when you are sold one thing and given another. And since you only get 1 core, even an older CPU will perform better as soon as you have more than one workload assigned to your machine.

I **really really** want to like Leafcloud. Even the idea of it tickles my brain - the technical challenge of figuring out many tiny distributed data centres must be really fun, not to mention the engineering challenge of adapting each server to its environment. And I would gladly pay a reasonable premium to run my workloads on a sustainable service that is a net positive to the society and the environment. Unfortunately, the bait and switch on the CPU, and the unclarity on what happens if you do go over the 100GB egress (all it takes is one rogue crawler...), combined with the lack of any multi-core offerings under 20€, is a bummer. I hope this concept takes off, but for an individual it is a bit of a tough sell at this point.

## Datalix 🇩🇪

Datalix is a Frankfurt-based provider that offers *suspiciously cheap* instances and object storage in their Frankfurt data centre. Upon further investigation it appears they are colocated in Equinix's data centres. This is fine, but then you are again relying on an American company to keep the lights on, which is against the spirit of this overview. They were also sold out of all servers on all tiers when I tried to get one. Oh well.

## 0ping 🇩🇪

0ping is another cloud provider that colocates their gear in Equinix's Frankfurt data centres. They also want you to sign up for at least one month's worth of service. 

## bunny.net 🇸🇮

Bunny.net is a Slovenian CDN with more than 119 points of presence around the world. Despite being on a ton of "EU cloud provider" lists, they do not offer traditional servers. Instead they offer a CDN, object storage, a distributed database that charges you per read/write rather than per instance, and a container runtime. 

I have only heard good things about their pricing and performance, and the object storage seems genuinely useful if combined with one of the aforementioned options as it does not have a mandatory minimum (especially if combined with the *Volume* network which halves the egress traffic pricing). As they do not have a VPS product, I can not compare it with other providers here. I did sign up for it and received $50 in trial credits to mess around with, so I might combine their flexible object storage with another provider's compute.

## Takehost.biz 🇪🇪

Takehost is an Estonian provider that claims to have the most performant VPSs on the market. To investigate these claims, and the proudly displayed 99,97% uptime stat (that is 15 minutes of outages per month, by the way - not sure that is a flex they think it is), I suffered through a nauseating vibecoded intro page that was not discouraged even my system's *reduce motion* setting or my GPU's coil whine. My scroll was hijacked to display a bunch of 3D animations, stats I do not care about, CLI commands, and a bold claim that "The hardware is real!" (I sure hope so), "Now pick yours.". This was then followed by an animated layer of noise smeared over the rest of the page as I was trying to read it. 

Several nauseating animated forms later I made it to another vibecoded dashboard with a prominent agent suggesting I ask it about its offerings. Since one of the options was to request a *"Cheap VPS to learn and experiment"*, I clicked on that one, which led the machine to tell me I would pay 6 € a month for a 2 vCPU (Ryzen 9 7900X) / 4 GB RAM / 40 GB NVMe SSD server. Clicking on the helpful button the agent provided led me to a checkout page where my price was now 15 €, more than double of what the agent claimed.

Clicking around the infuriating carousel that flashbanged me with a bright animated alert on every click revealed that Takehost is in the same capacity crunch as some of the other providers. The 15 € instance in their German data centre is the only one available, so I was quietly pushed to it.  Anyway, I have no interest in signing up for an entire month, so I went to delete my account... only to figure out that no such option exists. Thankfully, I was able to exploit the vibes of missing validation to blank out most of the "required" fields like my address and phone number.

Even if "The hardware is real!" did not exactly pan out, I do encourage everyone to scroll through their home page, as it is a wonderful display of why you should never use drugs and Claude at the same time.

## Contabo 🇩🇪

Contabo is a German provider that mainly offers VPSs and dedicated servers. In the finest of German traditions, you must commit to a one-month contract, followed by a four week notice period unless you cash out the money in advance.

Clicking on a cheap VPS leads you to a page that tries to upsell you, telling you that your projects deserve better (no, trust me, it does not). Declining the upsell throws you to a checkout page in German. I guess that is the penance for not accepting the upsell. I do not speak German, and I am not about to enter a legally binding contract in a language I do not speak, so I bowed out.

## Stackit 🇩🇪

Stackit is "a sovereign cloud for companies", and the landing page reflects that - it is definitely aimed at the bureaucratic machine of your average European company's procurement department rather than an executive in charge of making decisions (as in US-centric companies) or your average nerd (as in nowhere anymore because everything's gone to the dogs). [The Dutch government](https://www.rijksoverheid.nl/actueel/nieuws/2026/04/23/rijksoverheid-sluit-deal-met-europees-cloudplatform-stackit) also recently signed a contract with Stackit to enable the use of their services in the government, lending it some more credence.

Signing up was pretty straightforward without excess information being collected, and I was soon looking at a fairly clean and efficient control panel, which then guided me to setting up my project. This is where it all fell apart - when they said it is "for companies" they clearly meant it, as to use Stackit, one must be a company located in Germany, Austria, Switzerland or the Netherlands. In their words, "private use is not possible".

I guess my euros stink because they were not blessed by the graceful touch of a billing department and five layers of managerial approval.

## Exoscale 🇨🇭

As the final entry on this list I am looking at a Swiss company. Switzerland is not in the EU, but it has just as strong, or even stronger, privacy assurances, and a famous tendency to [keep your secrets so long as you can afford to pay for it](https://en.wikipedia.org/wiki/Banking_in_Switzerland#Controversies). Anyway, Exoscale is a Swiss company that claims to care about my uptime and privacy. It looks like a reasonably featured platform with all the basic features you would expect: compute, storage, databases, GPUs and so on. The registration process was simple and easy, the UI is very clean and fast, and I even got 20€ to play around with.

The first 2GB+ instance is the **SMALL** tier which gives you 2 vCPUs / 2 GB RAM for 16,80 € per month. Storage is extra, and 20 GB will cost you another 2 € per month. You can choose one of Exoscale's 8 data centres, and the price seems to be the same no matter the location. IPv6 is disabled by default, but can be enabled for free. You get a terabyte of free traffic per month, and the bandwidth is the most generous out of all the providers here, at 10Gbps.

The same cannot be said for the CPUs, which are the same anemic Skylake Xeons available on Hetzner's thriftiest tier. Their benchmark comes in at around the same number at [860 single-core and 1190 multi-core](https://browser.geekbench.com/v7/cpu/292548 )... at over three times the price.

## Conclusion

![Danny DeVito clapping with tears coming out of his eyes, captioned 'This Fucking Sucks'](./this-fucking-sucks.gif)

Okay, well, it is not all that bleak, but out of 12 providers (not counting Bunny.net), I managed to get some sort of an offer out of only **eight** of them, with half of those asking me to commit for at least a month. Two well known providers had completely dysfunctional systems and one straight up did not allow me to become its customer. I was expecting a heated competition. In the end it is down to Hetzner, UpCloud, Leafcloud and Exoscale.

So, here is the judgement: Exoscale is way too expensive for what they offer on the lower end of the scale. Hetzner is straight up out of capacity on the budget tier, and the value proposition of the higher tier servers evaporates quickly. I really want to like Leafcloud and I understand why their prices are the way they are, yet that understanding does not change the prices.

That leaves **UpCloud** as the clear frontrunner. They seem to be doing most things right: the pricing of their starter tier is actually cheaper than the American providers I listed at the start, and in return you get a machine that passes for "current generation" at Vultr or "premium" at DigitalOcean. I am a bit surprised that I never heard of them before assembling this list, but having been to Finland (too) many times it does not really surprise me - they do tend to keep a lot of good things to themselves. So I will give them a shot for the next few months. If you do not see me crashing out on Bluesky, you can assume it all went well.

p.s. Do not email me for marketing on behalf of a provider I included or omitted, I am done with this for now and I will absolutely ignore you.

---

[^1]: Yes, a company in this list has a dedicated server powered by an 15-year-old Intel Atom in its offerings. Presumably you will be renting the founder's used Eee PC plugged into a spare Ethernet jack in the janitorial closet of whatever data centre they started up first. Hooray for reducing e-waste, I suppose?

[^2]: Mini-ITX my beloved...

[^3]: Just to be clear, this is a public offer that was applied automatically to my account at signup, which I created with a freshly generated anonymous email.

[^4]: Once again, I am not being paid to say this (in fact, Leafcloud and Vultr are the only providers that I had to pay to try rather than relying on a free trial)

[^5]: This may be an accurate assessment of my personality, though. Scaleway might not have sold me a VPS, but they did provide me with spiritual enlightenment.

[^6]: [Bisexual lighting](https://en.wikipedia.org/wiki/Bisexual_lighting) is a real thing, or at least real enough to have a Wikipedia article.
