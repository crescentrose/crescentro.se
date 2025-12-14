---
title: Introduction to cloud infrastructure

# https://sli.dev/features/drawing
drawings:
  persist: false

duration: 20min

fonts:
  provider: none
  serif: Departure Mono
  sans: Iosevka
  mono: Iosevka
---

# Introduction to modern cloud infrastructure

How we got here, what are we using, and avoiding common issues.

<a href="https://crescentro.se">@crescentro.se</a>

<!--
Hey all! Welcome! Today you will hopefully learn a bit about the concept of
cloud infrastructure. This is going to be very high level - the main purpose
is to give you some context and a starting point for your own learning journey.
If there's popular demand, we can have a follow-up to actually write some code
together and dive deeper into how to achieve certain common goals. So consider
today as a kind of 'house viewing' and you can decide whether you want to move
in.

I want to start by giving some background as to what even is this mythical
'infrastructure' thing we talk about, then give a brief demo of how we manage it,
and finally, what you can do to help avoid certain common issues.

Let's go back in time a bit to understand why we even need all this to begin
with.
-->

---

## An abridged history of managing infrastructure

In the early days of the web, every respectable company had at least a server
room, if not a data center of its own.

The physical servers were managed by an ancient tribe of wizards known as
"sysadmins".

<v-click>
Until...
</v-click>

<v-click>
<img src="./images/jeff-bezos.jpg" class="max-h-200px my-6" alt="Surprisingly high-resolution photo of Jeff Bezos" />
</v-click>

<!--
So, why can we not just shove a computer in a corner, install our stuff there,
and call it a day?

Well, back in the early days of the web, this is pretty much how it worked. A
company would build out a server room or a data centre and hire people to manage
it. If you wanted to run something on those machines, you'd need to interact
with a mythical being known as the "sysadmin", and hope that they are having a
good day.

[click] And then,

[click] Jeff Bezos.

He realised that his young e-commerce company needs to own a ton of servers to
cope with demand during the busy Black Friday and Christmas shopping periods.
But, most of the time, Amazon was just paying for capacity they were not using
at all. And while delivery drivers and warehouse workers could be hired
seasonally, servers had to be taken care of year-round. So good old Jeff had the
idea to sell his unused server capacity to other companies. This gave birth to
Amazon Web Services, the first cloud platform.
-->

---

## The cloud promise

Someone else will take care of your servers.

You can quickly scale up or down depending on your needs.

You don't just get servers, but _solutions_.

It will be cheaper!

> **Your margin is my opportunity.**
>
>    &ndash; commonly attributed to old mate Jeffy

<!--
Initially AWS only rented 'virtual machines' - slices of larger physical servers
from their data centres. The selling point was that you no longer needed to
plan for, purchase and build out server capacity, hire an army of Linux nerds
to maintain them, and double your HR department to deal with the nerds' lack
of social skills. If you misjudged your capacity, you could easily rent more
or reduce your allocation. You'd still need _some_ nerds, as the servers still
mostly ran Linux, but overall your initial investment would be way lower.

Soon, AWS and its competitors realised that Linux machines
are a commodity. The real value was in additional, specialized products. One of
the first ones was S3: you could pay Amazon pennies to store an infinite number
of files in a 'bucket'. And this might be trivial to us today, but the ability
to just get a little bit of storage detached from a physical machine was pretty
novel back in the day!

This kicked off a sort of an arms race in who could invent more and integrate
as many products as possible into a coherent unit. This interconnectivity also
made managing all of this much more complex.
-->

---

## From VMs to specific products

If you open a social media app on your phone, your request probably goes to...

- a DNS service (e.g. _Route 53_),
- which resolved (e.g. _Elastic IP_) to a load balancer (e.g. _Elastic Load Balancing_) close to you,
- encrypted via automatic certificates (e.g. _AWS Certificate Manager_),
- that routed your request into an internal network (e.g. _Amazon VPC_),
- and directs your request to an available API server (e.g. a pod in _Elastic Kubernetes Server_),
- which was automatically scaled up on virtual machines (e.g. _Amazon EC2_),
- and which will query a distributed database (e.g. _Aurora_),
- to give your phone URLs to media located on block storage (e.g. _S3_),
- which are distributed worldwide through a CDN (e.g. _CloudFront_)

<!--
Here's a quick sample of some of the cloud products that a modern system could
use. I'm not going to go through each one of them and what it does - you can
read it for yourself if you'd like to - this is purely illustrative.

This is what we mean when we say 'infrastructure' - a set of components,
and how are they connected. Each of these components will likely have multiple
different sub-components as well. If you're responsible for the infrastructure,
it's your job to know what options are out there, how do they connect to each
other, when to use which one, and how to stay within the budget. It can get
pretty rough!
-->

---

## This is REAL cloud, done by REAL devops engineers

LOOK at what Cloud Architects have been demanding your Respect for all this
time, with all the servers and software we built for them:

<img alt="Sample Google Cloud infrastructure" class="max-h-300px" src="https://docs.cloud.google.com/static/architecture/blueprints/enterprise-application-blueprint/images/eab-architecture.svg">

<!--
And just to prove that I'm not making this up, this is a basic example from
Google Cloud's documentation of some of the various components you might use to
deploy an enterprise app.

So in the end we did reduce the need for Linux nerds, but those were now
replaced by various 'Cloud Architects' and 'Infrastructure Specialists' and
'DevOps Engineers' who have to juggle an increasing number of cloud offerings
and perform differential calculus in their heads to estimate pricing.

The systems we have today are not perfect - it's easy to lock yourself in to
a specific vendor, and it's easy to over-rely on cloud services. Cloud outages
happen and you don't expect your fridge to stop working because us-east-1 is
down.

However, it's undeniable that the barrier to entry has been significantly
lowered which, on average, means it is easier to develop and deploy a product
with best practices in mind. The cloud is not perfect, far from it, but as
a concept it has enabled many things previously impossible, and when used in
appropriate measure can produce great results.
-->

---

## Infrastructure as Code

_Concept:_ Let an automated tool manage the infrastructure you specified in
configuration files rather than doing it manually.

This includes:

- servers
- file storage
- networks
- databases
- ... and any of the other 200 products!

<!--
So, if we do actually need at least some of the services above, we need a way to
make sure that we keep what's running under control. And the solution that won
out was a concept called 'infrastructure as code'.

What this means is that, rather than writing out a step by step process, you'd
declare what the desired outcome is, and a tool would make whatever changes were
needed to make sure that the outcome matches what you wanted.
-->

---

## Enter Terraform

Terraform is the most widely used IaC tool today.

You tell it *what* you want, rather than *how* you want it.

It will compare the current **state** with your **definition**, and perform
actions needed to achieve what you defined.

<!--
A lot of tools were, and continue to, be built. Currently the most popular
one for managing cloud resources is called Terraform. There are many reasons
for its popularity, but today the primary ones are that it's very established
with a lot of plug-ins, that it asserted itself as an industry standard, and
that it might not be the best at one specific thing, but it's usable for almost
any infrastructure job.
-->

---

## How it works

- Providers + resources -> configuration -> state

<v-click>

- **Providers** give you access to a platform.
  - Example: Google Cloud provider

</v-click>


<v-click>

- Providers expose many **resources**.
  - These will become your infrastructure.

</v-click>


<v-click>

- You define the resources you want in your **configuration**.

</v-click>

<v-click>

- Once you apply your configuration, the resources become a part of your **state**.

</v-click>

<!--
So, now you know a little bit about the purpose of Terraform and what it's
trying to solve. Let's take a look at how it does that.

The core tenants of Terraform that we will look at today are providers,
resources, configuration and state. There are more, but these ones are the
'bread and butter'. And these concepts generally carry over between different
tools in one form or another.

[click] A provider is a plug-in that gives you access to a specific platform
. So, if you install the Google Cloud provider, you will be able to manage any
Google Cloud resource. You can install as many providers as you want - this is
useful if you want to deploy to multiple cloud platforms.

[click] Resources are generally a service or product offered by a cloud
platform. Think storage buckets, or BigQuery tables.

[click] Your collection of resources is defined through your configuration. This
usually starts of as a simple text file, but can easily grow to multiple modules
and several interconnected configurations.

[click] Finally, once you apply your configuration, you will be left with a
state. The state is a file that keeps track of all resources that Terraform has
provisioned for you. It does not contain the actual full state of everything in
your project, which enables you to introduce Terraform gradually and only manage
a subset of resources.
-->

---

## Basic principles

Define a provider:

```tf [main.tf]
provider "google" {
  project     = "my-cool-project"
  region      = "europe-west4"
}
```

Add a resource to it:

```tf [main.tf]
resource "google_storage_bucket" "my_important_files" {
  name     = "my-important-files"
  location = "EU"
}
```

<!--
Let's see how this comes together in a small example. Here I have a very simple
configuration that tells Terraform to load the Google Cloud plugin, which makes
GCP resources available to me. Then I define one resource, which is a storage
bucket, with a name and a location.
-->

---

## Plan and execution

Run Terraform with the above configuration and receive a plan:

```diff [terraform apply] {all|7-12}
Terraform used the selected providers to generate the following execution plan.
Resource actions are indicated with the following symbols:
+ create

Terraform will perform the following actions:

# google_storage_bucket.my_important_files will be created
+ resource "google_storage_bucket" "my_important_files" {
    id       = (known after apply)
    name     = "my-important-files"
    location = "EU"
  }

Plan: 1 to add, 0 to change, 0 to destroy.
```

This shows you exactly what will happen before it happens.

<!--
When I execute this configuration, Terraform goes through two stages: planning
and applying. In the planning stage, Terraform will validate your configuration
and refresh its state. You will then have a chance to review the exact changes
that Terraform intends to make. This way you are confident that there will be
no unexpected side effects.
-->

---

## The state

A file that contains information **only** on the state of resources defined by your
configuration.

```json5 [state.tfstate]
{
  "resources": [{
      "mode": "managed",
      "type": "google_storage_bucket",
      "name": "my_important_files",
      "provider": "provider['registry.terraform.io/hashicorp/google']",
      "instances": [{ /* ... */ }]
    }]
}
```

A resource is:

- **created** if it exists in the configuration, but not in the state,
- **updated** OR **recreated** if the state and the configuration differ,
- **deleted** if it exists in the state, but not in the configuration.

<!--
Now that I've applied my changes, Terraform wrote the result into the state.
This can be a file on your machine, but in larger teams it is usually shared
via other means.

The state file will be refreshed whenever you trigger Terraform, but only for
resources that currently exist in the state. This means you can have resources
managed through other means, and Terraform won't touch them. This is either
good or bad.

Generally there's one state per environment - so if you work in a team with
shared resources, you might need to coordinate who applies what and in which
order. Otherwise you might accidentally code over someone else's work.

The state, and especially sharing it, tends to be something that trips up people
up often. Later on I will have some tips you can print out and keep next to your
screen as a cheat sheet for dealing with potential issues.
-->

---

## Workflow

1. Write your configuration and test in development
2. Ask your co-worker to review it
3. An automated system deploys it to production once approved

<v-click>

Or `git commit -am 'yolo' && git push -f main`, I'm not your boss

</v-click>

<v-after>
<img src="./images/real-men-test-in-production.jpg" class="max-h-200px" alt="Two dudes pushing forward a glider that a third dude is holding on to, captioned 'Real men test in production'">
</v-after>

<!--
Ideally you are not applying Terraform configurations in a production
environment all by yourself. Since Terraform configurations are just text
files, it's considered a best practice to keep them versioned and to request
reviews before applying them to production environments. In more mature
systems, individual developers rarely have unsupervised production access at
all, and infrastructure changes are pushed through a limited automated system
once approved and merged.

[click] Of course, this is just a convention. You're an adult, you can do what you want.
-->

---

## Where cloud goes wrong

- What to keep in mind while working?
- Where to go to learn more?

<!--
Alright, to wrap this up I want to quickly go through the four most common
misconceptions that myself and others struggle with when it comes to cloud
development. Each of these is a topic in and of itself, so the goal here is to
make you remember certain keywords which you can keep in mind while working, and
research if you start running into them.
-->

---

## 0. Identity and Access Management (IAM)

### Misconception

If I have access to something, my code will have access to that as well.

### Remember

Applications in the cloud run under service accounts, not your personal account.

### What you can do

- **Avoid:** Keep track of resources you use, use a policy analyzer to verify
  access
- **Fix:** Painfully add permissions one by one until your code runs

<!--
The first one is IAM, or Identity and Access Management. Access management in
the cloud can get pretty annoying. But in general, you should know that each
service runs under its own account, and those accounts need explicit permissions
to access any resource.

Here, the best thing you can do is to keep track of what your code needs access
to, and ideally where to get it, before deploying your service.

Keep in mind that you might need to ask someone else to give you this access.
So there can be a lead time here which delays your deployments. A good practice
here could be to have a dedicated "data access" service account that you can
impersonate through other service accounts.

Most cloud services offer a way to test what account has access to which
resource - make use of it if you can!
-->

---

## 1. Manual intervention

### Misconception

I can freely change resources provisioned by Terraform through other means.

### Remember

Terraform will **conflict** if you attempt to create a resource that exists,
**overwrite** your manual changes, and **break** if you delete a resource it
manages.


### What you can do

- **Avoid:** Once managed, only change resources through Terraform
- **Fix:** Manually update the state (dangerous, frowned upon)

<!--
The next one is about changing resources that you are managing, or want to
manage, through Terraform. You should really only manage those resources through
Terraform, or only through another solution.

For example, if you define a table in DBT, and also define a table in Terraform,
those two will conflict and constantly write over each other. You might even run
into data loss if the schemas differ and the table has to be recreated. Choose
one and stick with it.

It is possible to import resources into Terraform, ignore certain types of
changes, or manually remove them from the state, but those steps can be
annoying or difficult, so it's best to avoid those situations.
-->

---

## 2. Recreating


### Misconception

I can change anything at all through Terraform and nothing bad will ever happen.

### Remember

There are some changes that can only be made by **destroying** and re-creating a
resource &ndash; plan extra time for those.

### What you can do

- **Avoid:** Create a "v2" of your resource, move data over, delete old one
- **Fix:** Restore a backup. If you have one.

<!--
Next, recreating. When you change a resource, you might be able to perform an
"in-place" update, which just changes that one parameter. But you might also be
forced to "recreate" it. For example, significant changes to a BigQuery table
schema might require it to be dropped completely and recreated, meaning all
data will be lost. Changes like that are possible, but account for extra time,
and you might potentially need to run two versions in parallel.
-->

---

## 3. Billing

### Misconception

The cloud is cheap and I can reasonably predict how much it will cost.

### Remember

The money for Sergey Brin's next yacht has to come from somewhere.

### What you can do

- **Avoid:** Set quotas and billing alerts, define a resource target, (try to) use a cost calculator
- **Fix:** You hopefully spent your company's money and live in a country with strong labor laws.

<!--
And the last one is about cost. Cloud is a capital-b Business - often time the
most profitable part of a big tech company. You can and absolutely will get
fleeced if you are not careful. This does not mean you should not use it, but
the very first thing you should do after you punch in your credit card number
is to go into the settings and configure billing alerts, as well as hard
quotas which will stop usage once hit. Especially if it's your own money. An
accidentally leaked API key from that one time you tried to use Google Gemini
might end up costing you tens of thousands of dollars - and this is not a
hypothetical.

A common hidden cost is networking - for example, you have a service in one
region that's reading data from another region. This will cost you dearly, and
you won't even notice that it's happening until it does. High availability and
low latency are great for critical workflows, but for the rest, maybe stick to
the basics.

Another point, especially for more intensive workloads, is about resources. The
resources in the cloud might be "infinite", but their cost grows exponentially.
There's always a sweet spot, and it helps to have a target for optimization.
-->

---

## Where to learn more

**Roadmap: [DevOps in general](https://roadmap.sh/devops), [Terraform](https://roadmap.sh/terraform)**. roadmap.sh is a wonderful resource and I highly recommend it!

[Cloud architecture introduction (GCP, but applies in general)](https://cloud.google.com/learn/what-is-cloud-architecture).

[Terraform documentation](https://developer.hashicorp.com/terraform/intro).

Courses from [Microsoft](https://learn.microsoft.com/en-us/training/career-paths/devops-engineer), [Google](https://www.skills.google/paths/20).

<!--
I left a few links here, the next slide will have a link to this presentation
so you can go back to it and learn more if you're interested.
-->

---

## Q & A

<!--

Thanks for following along and hopefully you learned something today!

-->

<div class="w-full">
<img src="./images/cat-god.jpeg" class="max-h-300px py-6 mx-auto" />


</div>

<div class="text-align-center">
<p><a href="https://crescentro.se/slides/cloud-basics">crescentro.se/slides/cloud-basics</a></p>
<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
</div>
