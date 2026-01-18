+++
title = "Everything is a File"
description = "In this first half of a build-your-own-synthetic-file-system adventure, we take a look at what even is a file, and some inspiration behind building a synthetic file system."
date = 2026-01-18

[taxonomies]
categories = ["linux", "file systems", "plan 9", "unix"]
+++

One really cool heritage of the Unix system is the concept of *everything* being a file. Normally, you think of a file as a collection of bytes that exists somewhere on your drive. And that's true, for the most part. However, those are not the only types of files.

## What's a file?

For example, `/dev/urandom` on your Linux or macOS system is a cryptographically secure pseudorandom number generator. You can open it (use something like `hexdump -C /dev/urandom` so that you do not mess up your terminal), and an infinite stream of random data will come out.

`/dev/urandom` is what's known as a *device file* - the file is actually a representation of a device that exists in your system somewhere (most likely as a part of your CPU). The `/dev` directory also contains your video and audio cards, your disk drives, and a few more abstract concepts like your standard input and output or the infamous "black hole" of `/dev/null`. 

Other files might be [_sockets_](https://man7.org/linux/man-pages/man2/socket.2.html). In simple terms, when you see a socket file, you know that there's a program on the other end waiting for you to open and write to it[^socket]. Then, the program will _accept_ a connection, do something with what you write to the socket, and perhaps send you a response. If that sounds familiar, it's because they serve as a basis for networking. So, a socket file basically represents a server running on your machine.

Device files and sockets live on your disk, but files don't necessarily have to correspond to objects that _physically_ exist somewhere. On Linux, you can find a lot of information about your running system mounted under the `/sys` (for various kernel subsystems and device drivers) and `/proc` (for running processes) directories. If you run `cat /proc/$$/status` in your terminal, you will get a readout of [all the various information the kernel keeps track of regarding your shell](https://docs.kernel.org/filesystems/proc.html) [^$$]. The `/proc` directory also has files you can _write to_ if you want to change various kernel options - this is just what the [`sysctl` command does](https://wiki.archlinux.org/title/Sysctl). No system calls or C knowledge required!

## Inter-process communication

Obviously, all of these files are _special_ in some way. The kernel is not actually constantly reading and writing a bunch of files with the sole purpose of thrashing your SSD's lifespan. `/proc` and `/sys` are what's known as **synthetic** (or pseudo) **file systems** as their contents map to a chunk of memory that exists somewhere else. Here, they serve as a method of **inter-process communication** (IPC) - that is, getting multiple programs, in this case the kernel and whatever's on the other side, to talk to each other.

{% admonition(title="Pseudo, synthetic, and virtual") %}
There are a lot of terms for "fake" around file systems, so it's easy to get confused. A [virtual file system](https://docs.kernel.org/filesystems/vfs.html) (VFS) is an abstraction on top of a "real" file system that provides common operations like lookup, reading, writing and caching. The word "virtual" here does not imply anything about the "reality" of the actual files. On the other hand, "synthetic" or "pseudo" file systems are the ones with [no "real" files backing them up](https://en.wikipedia.org/wiki/Synthetic_file_system). 
{% end %}

In user-space, inter-process communication is generally solved with sockets or something more structured like [D-Bus](https://en.wikipedia.org/wiki/D-Bus). For example, the most excellent [Niri window manager](https://github.com/YaLTeR/niri/wiki/IPC) places a socket file in your `/run` directory[^run]. When you connect to it, you will get a fire hose of JSON-formatted events whenever something happens. You can also dispatch your own JSON messages to Niri to make it do something. Another example is desktop notifications: they are implemented as messages sent to your D-Bus session, which are then picked up by a program that subscribes to the same session.

If you want to get a few programs to talk to each other, you either need to call a helper program to do it for you, like invoking `niri msg` or `dbus-send`, and then process its output through something like a shell script. Alternatively, you need to write a decent chunk of code to interact with sockets and (de)serialize messages. It's great that these options exist! But why are they so different than the seemingly simpler `procfs` and `sysfs`?

## A historical detour

Plan 9, the operating system that Rob Pike (of subsequent Go language fame) and his Bell Labs fellows worked on, [took the "everything is a file" concept very far](https://en.wikipedia.org/wiki/Plan_9_from_Bell_Labs#Design_concepts). If you have half an hour to spare, watch Russ Cox's [A Tour of the Acme Editor](https://www.youtube.com/watch?v=dP1xVpMPn8M), the text editor that ships with Plan 9 and showcases the power of this concept[^mac] by solving a Go standard library bug in under three minutes[^bigbrain]. In short, the entirety of Acme's state is exposed as [a file system](https://9p.io/magic/man2html/4/acme): buffers, tabs, even the menus. You can read from synthetic files to see what's going on in the editor, and write to them to change the editor's state.

This approach extends beyond just plain IPC. Want to view or edit a wiki? There's [wikifs](https://9p.io/magic/man2html/4/wikifs). You want to read and send emails? [upasfs](https://9p.io/magic/man2html/4/upasfs). How about the entire Internet? You guessed it - [webfs](https://9p.io/magic/man2html/4/webfs). The important thing here is not that you can send an email by writing to a specific file through your terminal - that's a party trick at best - but that this approach decouples the data from the implementation, both on the back-end and the front-end.

Your email client does not need a SMTP and an IMAP library - you just need to read the `/mail` directory, mounted specifically for that client through a [name space](https://9p.io/sys/doc/names.html). Your fancy new email system that doesn't use SMTP or IMAP a la `hey.com` can work with any of those apps regardless. And neither your email provider nor your client need to "allow" you to create and run plugins - it is not difficult to imagine a small industry of universal email "plugins" that augment your mailbox, process incoming mail, prioritize them, add important ones to your to-do app, upload newsletters to your read-later app, regardless of which provider or client you use for any of those services. For my Bluesky friends, it's like [ATproto](https://atproto.com/guides/overview) without the need for all of your data to exist in a global panopticon!

## Making it real

I won't stand here and tell you with a straight face that my newfound purpose in life is to build synthetic file system abstractions on top of existing abstractions in the hope that we will usher in a new golden age in Rob Pike's image (although that would certainly be fun).

Beyond "it would be cool", there's zero incentive, financial or otherwise, to build systems like these: almost every device and system we use these days runs counter to these ideas. There are also practical concerns with this approach. You're dealing with inherently asynchronous operations (I/O) through an inherently synchronous system (`read`/`write` calls) with its own idiosyncracies like caching and syncing. You also somehow have to deal with differences in features between various systems: standards are only as good as the systems that respect them, regardless of whether they're REST APIs or hierarchical file systems. 

However! That's not to say we can't have some fun with it regardless. I think there's plenty of space to experiment with synthetic file systems in the context of niche Linux tools, and an audience of people who would be willing to use them. You could also just learn something about file systems in general, which is always useful. So, in the second part I will show you how to implement a simple user-space synthetic file system, and how it works behind the scenes.

[^socket]: When working with sockets, you'd usually say "connect" and "send/receive" rather than "open" and "write/read".
[^mac]: This demo was recorded on a Mac, but sadly mounting arbitrary file systems in userland no longer works on Macs. Explaining it would take another blog post that's the same length as this one, but as always, feel free to blame Tim Apple.
[^bigbrain]: Some people are just built differently.
[^$$]: `$$` is a special environment variable in `bash` and `zsh` that stands for "the PID of the shell". For extra points: what is the difference between that and `cat /proc/self/status`?
[^run]: `/run` is actually a "real" file system, but it fully exists in your RAM.
