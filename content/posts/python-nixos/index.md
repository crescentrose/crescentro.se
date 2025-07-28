+++
title = "Python and NixOS: A match made in hell"
description = "What happens when a purely functional, deterministic, declarative package management system meets Python."
date = 2025-07-28

[taxonomies]
categories = ["nixos", "python", "package management", "rant"]
+++

For the past couple of months I've been working on supporting a fairly interesting data science project at my day job. As pretty much everyone knows, the entire field of data science is oddly snake-shaped: Python is an inescapable reality, and whether you like it or not[^1], you have to work with it. In a follow-up to this post I will have more to say on where it falls short and how to best introduce the snake language to the crab language for data engineering. For now, a more pressing priority is _getting the damn thing to work on my machine_. 

While I use a MacBook for work as it's the most convenient option due to corporate rules, at home I prefer to sit in front of my Linux machine that runs NixOS. On the days that I'm working from home, I'd like to have a functioning development environment for the projects I'm working on. This has, thus far, not been a problem with Go or Rust projects. I can generally just include the Go compiler or `rustup`, as well as all the requisite tooling, in my `home.nix` and everything will just work.

Unfortunately, Python is a different beast. Much has been said about the absolute state of Python packaging, and while this will be pertinent soon, let's just keep it aside and try to get it to work. Which is, by my criteria:

- I type `python ./mycode.py` and it runs (duh).
- All the tests, linters, formatters, fixers and other niceties from the 1990s work.
- My editor has type hints and autocomplete courtesy of a LSP that can see the environment.
- When I submit a PR, my co-worker is not mocking me for committing 2891 whitespace changes because I accidentally used a version of `black` installed globally which I don't remember installing and which has its own set of formatting rules that is subtly different from the venv `black` which can only see the rules from `pyproject.toml` if I run it while I'm in a shell that's had its `$PATH` chang-- ah fuck, this is just another Python package management rant, isn't it? goddamnit,

## Don't care, I just really need this to work

If you are here from Google or [Better Google](https://kagi.com/), here's a quick summary of what to do and not to do when trying to work on a Python project under NixOS:

| **Your project uses...**                                                                                                                               | **You will need to...**                                                                                                   | **and it will take you...**                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`uv`](https://docs.astral.sh/uv/) or [`poetry`](https://python-poetry.org/) with a [supported Python version](https://devguide.python.org/versions/). | Use `nix-ld` to cheat on NixOS - copy-paste [this bit here](#solution-cheat-on-nixos).                                    | 15 minutes, give or take                             |
| `pip` (`requirements.txt`) with a supported Python version, but I can change that.                                                                     | [Migrate from `pip` to `uv`](https://docs.astral.sh/uv/guides/migration/pip-to-project/) and then use the above approach. | depending on how lucky you are, an hour or so        |
| `pip` with a supported Python version, my team hates change, but at least we do **not** have any native code (e.g. no `numpy` or `psycopg`).           | Use a similar `shell.nix` as above, but omit `nix-ld` and use a Python from `nixpkgs`, then manually manage your `venv`.   | about 15 minutes                                     |
| `pip` (`requirements.txt`) with a supported Python version, my team hates change, and we depend on native code.                                        | Set up [dev-containers](https://containers.dev/) - I hope you like VS Code.                                              | an hour or so if you want to set up everything right |
| `pip` with an **unsupported** Python version, and I am unable to do anything about it                                                                  | Look for a new job.                                                                                                       | in this job market? lmao                             |

This should cover most use cases with the least amount of pain. The rest of this post will talk a bit about the specificities of Nix and NixOS, why NixOS doesn't work with binaries compiled for other Linux distros, the conceptual differences between distributing Python code and Nix packages, and some alternatives.

## What's the deal with NixOS?

If you hang out around nerds - thanks [raspy](https://jackavery.ca/)[^2] - you probably heard of [Nix and NixOS](https://nixos.org/). At its core, Nix is a build system that takes a file (an _expression_) written in the Nix language, and produces set of files (a _derivation_). The expressions are deterministic[^3], so you should always get the same derivation from the same expression. They are also built in isolation, so you have to declare each dependency, or the derivation will fail to build. Finally, as Nix is a functional language, you can easily build variations of any derivation by just tweaking a few parameters.

This means that two packages can depend on different versions of `node` or `python`, and neither will conflict with another. Gone are the days of "system Python" being too old or too new for the program you're trying to use - the Google Cloud SDK can depend on Python 3.8 for all I care. Also gone are the days of meticulously tracking which dependency was installed for what package and hoping you cleaned everything up when uninstalling something.
 
NixOS expands on this concept by allowing you to declare _the entire state of your system_. This essentially turns your entire environment into a derivation: every package, `systemd` unit and configuration file is in one place. An update can never break something - as your system is a function of a configuration file, you can always go back by just selecting a different option in the boot menu. You're guaranteed to never lose any of your customizations. And NixOS ships with _thousands_ of options that make installing and managing popular software easier.

So, if NixOS is so good, what is my issue with it and Python? Well, due to its specificities, NixOS cannot run dynamically linked binaries built for other distributions. In other words, because every dependency is managed by Nix and isolated in its own environment, if you attempt to load something as basic as `libc`, it will fail. `/lib/libc.so.6` is simply not a path that exists on a NixOS system. This is evident by running `ldd` on something like `bash` - here's the difference between my Ubuntu 24.04.2 LTS home server, and my NixOS desktop:

```
# On Ubuntu - everything's in a "well known" spot
$ ldd /usr/bin/bash
	linux-vdso.so.1 (0x00007ffc4b984000)
	libtinfo.so.6 => /lib/x86_64-linux-gnu/libtinfo.so.6 (0x00007912aea40000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007912ae800000)
	/lib64/ld-linux-x86-64.so.2 (0x00007912aebef000)

# On NixOS - better hope you declared your dependencies!
$ ldd (which bash | get 0."path")
	linux-vdso.so.1 (0x00007f9c14290000)
	libdl.so.2 => /nix/store/g2jzxk3s7cnkhh8yq55l4fbvf639zy37-glibc-2.40-66/lib/libdl.so.2 (0x00007f9c14283000)
	libc.so.6 => /nix/store/g2jzxk3s7cnkhh8yq55l4fbvf639zy37-glibc-2.40-66/lib/libc.so.6 (0x00007f9c14000000)
	/nix/store/g2jzxk3s7cnkhh8yq55l4fbvf639zy37-glibc-2.40-66/lib/ld-linux-x86-64.so.2 => /nix/store/g2jzxk3s7cnkhh8yq55l4fbvf639zy37-glibc-2.40-66/lib64/ld-linux-x86-64.so.2 (0x00007f9c14292000)
```

{% admonition(title="Hey, what's that mysterious 'vdso' thing?") %}
`vDSO` stands for [virtual dynamic shared object](https://man7.org/linux/man-pages/man7/vdso.7.html), a small dynamic library that the kernel automatically embeds in memory of all user-space programs as a method of optimization.
{% end %}

Attempting to run `bash` compiled for Ubuntu or any other distro will result in the dreaded ["NixOS cannot run dynamically linked executables intended for generic Linux environments"](https://nix.dev/guides/faq.html#how-to-run-non-nix-executables) error message. If you use the [`uv`](https://docs.astral.sh/uv/) package manager, for example, it will try to [download and install a pre-compiled Python interpreter](https://docs.astral.sh/uv/concepts/python-versions/#managed-python-distributions) for you, which is very useful if you're on a "normal" system, but breaks by default on NixOS. And while that is at least easy to change, there is a much worse problem, which is...

## What's the deal with native extensions?

 If you are particularly lucky, your dependencies will include native extensions: code that calls out to C, C++, Rust or other code - think PostgreSQL database drivers, numpy, or Polars. Each of those libraries will try to download its own pre-compiled variant (also known as a "wheel"). Unfortunately, those are usually compiled for "manylinux", an [arcane system that targets CentOS 8 and Ubuntu 18.10 in its latest stable release](https://github.com/pypa/manylinux) and expects a "vanilla" Linux distribution with dynamic libraries in their "standard" locations. Even worse, since you _are_ running a flavor of Linux, most Python package managers will happily download the "wheel", only for it to blow up at runtime.

This means that you are at the mercy of [whatever custom build system the authors of the package chose](https://packaging.python.org/en/latest/tutorials/packaging-projects/#choosing-a-build-backend), trying to guess what libraries it depends on and either building it from source, or adjusting your environment to include the expected shared libraries [by manipulating `LD_LIBRARY_PATH`](https://man7.org/linux/man-pages/man8/ld.so.8.html). And if you're _exceptionally_ lucky, a dependency will throw up a build error that says `Must provide ADBC_POSTGRESQL_LIBRARY`, with no further explanation either in the error message or the build documentation about how to provide said library.

However! Just because NixOS does not provide dynamic libraries does *not* mean we *cannot* provide some ourselves.

## Solution: Cheat on NixOS

There's a genius project called [`nix-ld`](https://github.com/nix-community/nix-ld) which will let you run binaries that link to shared libraries on NixOS without patching them. Since it works best with completely unpatched libraries, we can even turn `uv`'s default behavior of downloading a Python interpreter in our favor, and let `nix-ld` do all the heavy lifting. This gets you as close as possible to a "normal" experience.

To get started, you will need to set up `nix-ld`, which can be done through your system `configuration.nix`.

```nix
programs.nix-ld.enable = true;
```

Run `nixos-rebuild switch` to activate the new config, then navigate to your project and create a new file called `shell.nix` in the project root. In it, paste the following:

```nix
with import <nixpkgs> {};
pkgs.mkShell {
  name = "make-more-money"; # change this to something more catchy
	
  # Here is where you will add all the libraries required by your native modules
  # You can use the following one-liner to find out which ones you need.
  # Just make sure you have `gcc` installed.
  # `find .venv/ -type f -name "*.so" | xargs ldd | grep "not found" | sort | uniq`
  NIX_LD_LIBRARY_PATH = lib.makeLibraryPath [
    stdenv.cc.cc # libstdc++
    # zlib # libz (for numpy)
  ];

  NIX_LD = lib.fileContents "${stdenv.cc}/nix-support/dynamic-linker";

  packages = with pkgs; [
    # If you're using Poetry, comment out `uv` and uncomment the following two lines:
    #   python313 # set to your Python version
    #   poetry
    uv
  ];

  # Uncomment if you're using Poetry - since we're using a Nix-provided `python`
  # as opposed to an unpatched one, we need to explicitly inform it of the
  # dynamic library path.
  #
  # shellHook = ''
  #   export LD_LIBRARY_PATH=$NIX_LD_LIBRARY_PATH
  # '';
}
```

With that in place, you should be able to run [`nix-shell`](https://nix.dev/manual/nix/2.18/command-ref/nix-shell) to enter this shell, run `uv sync` or `poetry sync`, and everything should _just work_. 

**That's it!**

The `shell.nix` file you just created gives you some cool powers to go along - namely, you can add a `shellHook` that automatically enters your virtual environment to save you some typing:

```nix
with import <nixpkgs> {};
pkgs.mkShell {
  # ... the rest of it ...
  
  shellHook = ''
    . .venv/bin/activate
  '';
}
```
 
 And to save even more typing, you can also set up [direnv](https://github.com/nix-community/nix-direnv) to automatically enter the `nix-shell` whenever you `cd` to a directory with one.

## Alternatives

The above approach was surprisingly sufficient for me, but everyone's situation is different. Below are a handful of other solutions that might better suit your needs, if the above option fails.

### devenv

`devenv` is a declarative developer environment system powered by Nix. It's essentially a "batteries included" [`direnv`](https://direnv.net/). It integrates well with `uv` and `poetry`, and you can use the above `nix-ld` hack with it quite easily.

The configuration structure is pretty straightforward, and it also enables other niceties such as defining common tasks or running services like a database server. In theory, your co-workers could also use it to manage their own development environment, elevating your status from "weirdo who explains functional package managers" to "cool uncle showing you a fancy trick". In practice, sadly, your co-workers all use corporate-provisioned macOS systems that enforce some moronic Microsoft "endpoint security" system which somehow only ever flags false positives despite consuming gigabytes of memory and also makes Nix borderline unusable.

### uv2nix

There's an ambitious project called [`uv2nix`](https://pyproject-nix.github.io/uv2nix/introduction.html) which converts `uv` workspaces to a Nix derivation on the fly. When I first saw it referenced, I thought it was the solution to all of my problems.

However, in true Nix fashion, [the "Basic Usage" page](https://pyproject-nix.github.io/uv2nix/usage/hello-world.html) hits you with an, I quote, "conceptually simple" `flake.nix` for a "hello world" that clocks in at 214 lines. If reading that sentence made you excited, by all means use `uv2nix`. Personally, I tried picturing the faces of my data science co-workers as I attempt to explain what's an overlay of a Nix derivation and why do I need it, and then closed the tab.

### buildFHSEnv

In some particularly stubborn cases, you might want to eschew the above `nix-ld` approach for a `buildFHSEnv` approach, which will essentially build a mini-container with a "regular" Linux file system inside. The [`nixpkgs` reference manual has a simple example](https://nixos.org/manual/nixpkgs/stable/#sec-fhs-environments) of what such a `shell.nix` might look like.

### Virtualization

If all else fails, do what all the smart people would have done eight paragraphs ago: give up. Boot up an Ubuntu VM and call it a day.


[^1]: I promise that my main grudge with Python is really just the state of the packaging and distribution system. The rest of it is fine, it's just that this particular part is quite unavoidable and quite messy.

[^2]: His attempt to debunk the nerd allegations was to link me his [static site generator in POSIX shell he wrote "for fun"](https://github.com/jack-avery/shtml). Never change 💜

[^3]: Some people love to point out that Nix is not fully deterministic because edge cases exist - if a package's source code is inaccessible, the derivation will fail to build. This is, of course, true. Another pro-tip is that, if you pour water on your motherboard, `nixos-rebuild` will fail to run, thus clearly making it non-deterministic and useless.

