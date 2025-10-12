+++
title = "Replacing a running Linux system with NixOS over SSH"
description = "Juggling chainsaws."
date = 2025-10-12

[taxonomies]
categories = ["nixos", "ssh", "self-hosting"]
+++

For the past four years I've had a cheap-ish, used Lenovo notebook stuck upside
down in my electrical closet running as a computing equivalent of that one
messy catch-all kitchen drawer. It ran Plex, [Miniflux](https://miniflux.app/),
backups, a remote `mpd` server, a [Tailscale](https://tailscale.com/) exit node,
and a handful of other things on it. And as a real self-hosting enthusiast I've
always *meant to* clean it up but never did.

However, recently Plex went through its yearly "oopsie, we once again leaked
your data" phase which finally gave me the last kick I needed to stop paying for
the Plex Pass and switch to [Jellyfin](https://jellyfin.org/). And with that it
was also time to clean up the cruft from the machine as well.

As I've mostly enjoyed my time with NixOS on my desktop, I thought about giving
it a go on the server as well. A server should, in fact, be the ideal use
case for Nix: it lets you write a declarative config and then deploy it to any
machine, either remotely or locally.

Nix also has a vast repository of programs packaged as services, meaning
that you can configure them easily through Nix itself. So if I want to set up
Jellyfin, I don't need to run any installers or edit any config files manually,
I can just define what I want in an expression and let Nix take care of the
rest.

As I am also lazy, I wanted to do this without getting up from my chair, fishing
out the notebook and sitting on the kitchen floor with a recovery drive in
hand manually typing in commands until I get to a ssh-able state like some
sort of caveman. So, today we're going to try to replace an Ubuntu 24.04 LTS
installation with a NixOS system exclusively over SSH with minimal downtime.

The [NixOS manual has a basic explainer on how
one would install NixOS from another, running
distro](https://nixos.org/manual/nixos/stable/#sec-installing-from-other-distro)
. The manual is, though, not intended for remote setups, nor is it meant to give
you anything beyond a simple, blank slate. What I wanted was to hit the ground
running and have as little downtime as possible rather than struggle with days
of trial and error.

It turns out Nix is very flexible and you can, in fact, do just that with
a couple of extra steps. And on the way you can gain a slightly deeper
appreciation of how it all works in the background.

## Preparing the flake

For this to work, you will need to have one *host* Linux or Mac system on which
you can develop and test the new OS image, and one *target* Linux system on
which you will install the new OS. Both host and target should have [Nix, the
package manager](https://nix.dev/install-nix) installed.

It also helps to have some working knowledge of Nix already as this is not a
very beginner-friendly guide. Although if you are very stubborn you can probably
work your way through this with some extra Googling.

{% admonition(title = "Switching out the OS on the same machine") %}
If your host and target are the same you can mostly still follow along, but I
would **strongly recommend** you make a full backup of your machine and have a
recovery USB drive ready in case something goes wrong
{% end %}

Like with any other NixOS system, you start with an empty folder to which you
add a `flake.nix`:

```nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { nixpkgs, ... }:
    let
      system = "x86_64-linux";
    in
    {
      # Replace YOUR_HOSTNAME with whatever the name of the machine
      # you are deploying to is
      nixosConfigurations.YOUR_HOSTNAME = nixpkgs.lib.nixosSystem {
        inherit system;
        modules = [
            configuration.nix
        ];
      };
    };
}
```

To get a bare-bones `configuration.nix` going, the following should suffice:

```nix
{ pkgs, ... }:
{
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;
  
  # We'll be testing our config in a VM. You can define the VM
  # settings here.
  virtualisation.vmVariant = {
    virtualisation = {
      memorySize = 1024;
      cores = 2;
      graphics = false;
    };
  };
  
  # Replace YOUR_USERNAME with whatever account name you want to use
  users.users.YOUR_USERNAME = {
    isNormalUser = true;
    initialPassword = "password"; # change me
    extraGroups = ["wheel"]; # for sudo
  };

  environment.systemPackages = with pkgs; [
     # just for testing - replace it later
     fortune 
  ];

  # Enable "experimental" commands in built machine
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  system.stateVersion = "25.05";
}
```

Run `nix flake update` to set up your `flake.lock` and lock the `nixpkgs` input. 

## Testing in a VM

The next thing I wanted to do was to make sure my configuration _works_ before
nuking my server. Well, Nix can easily build QEMU VMs from a flake:

```sh
nix build ".#nixosConfigurations.YOUR_HOSTNAME.config.system.build.vm"
```

This takes about 30 seconds on my machine, and Nix then helpfully
provides a launcher script for the VM, which will be symlinked to
`result/bin/run-YOUR_HOSTNAME-vm` in your flake's directory. You can run it with
a few extra environment variables to map the SSH port to port `2221` on your
host machine and to see the boot process unfold before your eyes:

```sh
QEMU_NET_OPTS="hostfwd=tcp::2221-:22" QEMU_KERNEL_PARAMS="console=ttyS0" ./result/bin/run-YOUR_HOSTNAME-vm -nographic
```

At this point we have a very boring, very blank OS running in a VM defined
purely from one configuration file. Now you can set up each component of your
server, and test after major changes to make sure it still works as intended.
This may take you 30 minutes if you have a simple setup, or you might be
migrating your setup for a week. Either way, your existing system remains
untouched and you can take your time.

I won't go into details on how to write NixOS
configurations as that is much better covered
[elsewhere](https://nixos-and-flakes.thiscute.world/introduction/). But for
this specific use case, there are a couple of easy-to-miss footguns. So, before
proceeding, make sure you:

- defined root account password _(in case you need to physically log in to the machine)_
- configured the machine with a static IP _(so you know where to SSH into after the reinstall)_
- have SSH access set up properly _(test it!)_
- make sure to inhibit sleep on lid close _(if your machine is also a notebook permanently running in clamshell mode)_ 

## Adding the target system configuration

Once you have the flake defined roughly as you want it, it's time to
prepare the target system. This is where you should also have the [official
manual](https://nixos.org/manual/nixos/stable/#sec-installing-from-other-distro)
open in a second tab as I will reference its steps here frequently.

Follow the first three steps as explained in the manual: install [Nix, the
package manager](https://nix.dev/install-nix) **on the target machine** if you
have not already, and set up the NixOS channel. You can then install the aptly
named `nixos-install-tools`, and generate the hardware configuration.

```sh
curl -L https://nixos.org/nix/install | sh
. $HOME/.nix-profile/etc/profile.d/nix.sh
nix-channel --add https://nixos.org/channels/nixos-unstable nixpkgs
nix-env -f '<nixpkgs>' -iA nixos-install-tools
```

This is where we diverge from the manual. **On the target machine**, enable the
"experimental" features by adding the following line to `/etc/nix/nix.conf`:

```
experimental-features = nix-command flakes
```

{% admonition(title="Why do I need to enable 'experimental' features?") %}
I'm assuming that Nix maintainers are the same people who kept Gmail in "beta"
for 5 years even as it became the most widely used email service in the world
and want to recapture some of that magic.
{% end %}

Now generate the `hardware-configuration.nix` file which tells NixOS what kind
of hardware it needs to plan for. This can be done with the following command
**on the target machine**:

```sh
sudo `which nixos-generate-config` --show-hardware-config
```

We can copy-paste the output into a new `hardware-configuration.nix` file
in the flake on the host machine, and make sure to import it from the main
`configuration.nix` using `imports = [ ./hardware-configuration.nix ]`.

**Make sure to review the generated file.** Mainly this is about file systems.
Remove all `snap` and `docker` mounts, and any other ephemeral mounts.

Another important thing to note is the boot mounts. Some systems, **especially
Debian and Ubuntu**, have separate volumes for `/boot` and `/boot/EFI`, whereas
NixOS expects the EFI volume to be mounted directly in `/boot`.

In human terms, if you see both a `filesystems."/boot"` and a
`filesystems."/boot/EFI"` entry, remove the `/boot` one and rename the
`/boot/EFI` one to just `/boot`. You can usually recognize the EFI volume by
its shorter UUID, `vfat` file system type and `fmask` and `dmask` mount options
set. You will also have to perform an additional step before actually triggering
the installation.

## Build the output

Now we are going to essentially replicate the `nixos-rebuild` process manually
to bootstrap our install.

Copy the flake to the **target** machine and build it.

```sh
# on the host
rsync -avz --progress /path/to/flake username@hostname:~/flake

# on the target
cd flake
nix build ".#nixosConfigurations.YOUR_HOSTNAME.config.system.build.toplevel" --print-out-paths
```

This command will also give you a path to a directory in the Nix store. Make
sure to note it as we will need it.

At this point the official `nixos-rebuild` script checks for the existence of a
`nixos-version` file within this directory. You can replicate this by trying to
`cat` it:

```sh
cat NIX_STORE_PATH_FROM_PREVIOUS_COMMAND/nixos-version
# => 25.11.20251011.3627919
```

Then, you can set the `system` profile to point to your newly built system. This
won't do anything yet because the underlying OS is still whatever you had before
this entire process, but it's important for when we finally switch to NixOS.

```sh
sudo `which nix-env` -p /nix/var/nix/profiles/system --set NIX_STORE_PATH_FROM_PREVIOUS_COMMAND
```

Your new NixOS system is now on the target machine, ready to replace your existing OS.

## Final assembly

The above steps leave you at **step 11 of the official manual**. In principle,
what you need to do next is to change the ownership of the Nix store to `root`
if it was not defined as such already:

```sh
sudo chown -R 0:0 /nix
```

Then set up the `NIXOS` file which informs Nix it's running under NixOS, as well
as the `NIXOS_LUSTRATE` file which essentially tells Nix to remove anything it
doesn't recognise (i.e., your entire existing system).

```sh
sudo touch /etc/NIXOS
sudo touch /etc/NIXOS_LUSTRATE
```

The official manual also has you add `/etc/nixos` as an exception to this file
to preserve it across reboots. If you want to have your flake source accessible
after you install NixOS, you will need to move it there. This is important if
you are doing this all on the same machine, but for my use case I plan on keep
rebuilding on the host and applying changes via SSH, so I just skipped this.

```sh
# Yes, without the leading slash, apparently
echo etc/nixos | sudo tee -a /etc/NIXOS_LUSTRATE
```

Finally, **the point of no return**. Up until now you could give up and retain
your system exactly as it was. Before continuing, **make sure you have a backup
and a recovery USB drive**, especially if you're doing this on your primary
machine.

The manual wants you to make a backup of the `/boot` directory:

```sh
sudo mkdir /boot.bak && sudo mv /boot/* /boot.bak
``` 

At this point I got a permission error, likely to do with Ubuntu's `/boot` being
split between two volumes. **This is fine**. However, if your `/boot` was split
between multiple volumes, you **need** to remount **just the EFI partition**
under `/boot` for NixOS to properly install the bootloader. Do the following:

```sh
# Only do this if your `/boot` and `/boot/efi` are different volumes!

# Note the device path for the EFI volume
mount | grep boot/efi
# => /dev/disk/by-uuid/ABCD-EF12 on /boot/efi type vfat ( ... )

# Remount /boot/efi as /boot
sudo umount /boot/efi
sudo umount /boot

# replace the device path with the one from the first command
sudo mount /dev/disk/by-uuid/ABCD-EF12 /boot -o rw,fmask=0077,dmask=0077
```

Then, as the last step, cross your fingers, tell Nix to take over at next boot,
and reboot your machine:

```sh
sudo NIXOS_INSTALL_BOOTLOADER=1 /nix/var/nix/profiles/system/bin/switch-to-configuration boot
sudo reboot
```

And... that's it! For me, the reboot process was basically instant - a minute or
so later I was able to `ssh` into my new-old machine which was already running
everything I set up on it during my VM experimentation process.

## Some final thoughts

NixOS will leave your old data (including your old `/home`) under `/old-root`.
You can keep it for some time, or delete it if you have other backups. The
`NIX_LUSTRATE` file is a part of the old root, so you don't have to worry about
it running again and deleting your files.

If you forgot to set a static IP, or it didn't work for some reason, you can use
`nmap` to discover all devices on your network by running something like `sudo
nmap -sn 192.168.1.0/24` (depending on the subnet mask of your network). Or you
can just get up and physically log into the machine to get its IP.

You don't need to maintain a copy of the flake on the target machine once you've
set it up - just build the derivation on your host machine and then remotely
switch to it:

```sh
nixos-rebuild --flake ".#YOUR_HOSTNAME" --target-host YOUR_SSH_USERNAME@TARGET_IP --sudo switch
```

Finally, you might consider making your new server *stateless* by only retaining
`/nix` and `/boot` (and maybe a directory in which you want to keep persistent
data) in between reboots. This would force you to keep everything defined in
your flake rather than performing ad-hoc changes. This is a topic for another
post, however!
