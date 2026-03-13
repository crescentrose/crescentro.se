+++
title = "The Compose key is magic"
description = "Fast emoji and special character input on your Linux desktop? For free? In THIS economy?"
date = 2026-03-13

[taxonomies]
categories = ["linux", "desktop", "briefs", "unicode"]
+++

I've been in a bit of a coding slump recently due to a constellation of work and
personal Stuff™, and in situations like those I enjoy procrastinating by
tweaking my desktop setup (do kids still call this _ricing_?).

One of the small things that's always annoyed me is that, if I want to input the
glorious currency symbol of our great monetary union, I basically need to search
for "eur symbol" somewhere and copy-paste it. On a Mac with the Dutch layout,
the € symbol can be produced by hitting `Option + 2`, but on my Linux desktop
with the `nl(mac)` layout[^1], the closest thing is `Right Command + 2`
(interpreted by the system as `AltGr+2`), which gives me a nice `²`.

In skimming through various docs, forum posts and wiki pages, I ran into an
`xkb` option to change the behaviour for the € symbol specifically, but I also
ran into something far more interesting: the [Compose key]. It turns out that
there's a special key you can use to write custom symbols as a sequence of
normal keystrokes. 

So, if I want the € symbol, all I need to do is to push the `Compose` key, then
`e`, then `=`. And this is not the only option: `Compose` followed by `1` `4`
will produce `¼`, `Compose o e` will produce `œ`, and there are dozens of other
predefined combinations for all sorts of symbols, characters and accents that
also make sense mnemonically rather than being an obscure key combination.

That's not the only feature: if you place a file named `.XCompose` in your home
directory, you can add custom combinations! So, if I want to send a heart, I can
just hit `Compose < 3` and I will get a ♥. Besides emoji, I also find myself
often looking up various arrows and punctuation: now I can simply hit `Compose - >`
and get a nice → arrow quickly.

## Set up

The Compose key is a real key, but very few ‒ if any ‒ keyboards ship with it.
If you have a keyboard with [customizable firmware], perhaps you could hack
something in. But a far easier way is to map it to an existing key. I mapped
mine to the right Option key (the right Windows/Meta/Super key if you prefer the
worse layout), which meant adding `compose:rwin` to `xkb` options in my Niri
config file. If you use a DE, there is probably a setting somewhere.

```kdl
input {
  keyboard {
    xkb {
      layout "nl(mac)"
      options "compose:rwin" // ← Add this
      // You can also use `compose:menu`, `compose:caps`, `compose:paus` or
      // `compose:sclk` (scroll lock) if you want to reuse one of the other
      // useless keys on your keyboard.
    }
  }
}
```

For GTK 4 apps on Wayland, you will also need to have an [IME] (Input Method
Editor). Most DEs ship with one already, but if you run a WM, you will need to
set one up. [IBus] seems like a reasonable choice. On Nix, you can add this to
your config:

```nix
i18n.inputMethod = {
  enable = true;
  type = "ibus";
};
```

Then, you can add custom sequences to the `.XCompose` file in your home
directory. Here's mine ‒ feel free to steal it, or build your own.

```yaml
# include the global configuration
include "%L"

# Emoji
<Multi_key> <colon> <parenright>                     : "🙂"  # smile
<Multi_key> <colon> <D>                              : "😀"  # millennial laugh
<Multi_key> <X> <D>                                  : "😂"  # boomer laugh
<Multi_key> <T> <underscore> <T>                     : "😭"  # zoomer laugh
<Multi_key> <X> <underscore> <X>                     : "💀"  # gen alpha laugh
<Multi_key> <B> <parenright>                         : "😎"  # cool
<Multi_key> <u> <w> <u>                              : "🥺"  # uwu
<Multi_key> <plus> <1>                               : "👍"  # thumbs up
<Multi_key> <minus> <1>                              : "👎"  # thumbs down
<Multi_key> <6> <7>                                  : "🤷"  # shrug
<Multi_key> <less> <3>                               : "♥"   # basic heart
<Multi_key> <less> <less> <3>                        : "❤️"  # red heart
<Multi_key> <colon> <less> <3>                       : "💜"  # purple heart
<Multi_key> <asterisk> <asterisk>                    : "✨"  # sparkles

# Arrows
<Multi_key> <minus> <less>                           : "←"
<Multi_key> <minus> <greater>                        : "→"
<Multi_key> <minus> <asciicircum>                    : "↑"
<Multi_key> <minus> <v>                              : "↓"
<Multi_key> <minus> <minus> <v>                      : "↴"
<Multi_key> <minus> <minus> <less>                   : "↲"

# Misc
<Multi_key> <minus> <minus>                          : "–" # en-dash
```

If you're having trouble putting it all together, [here's the commit] to my
dotfiles that makes it happen.

[customizable firmware]: https://docs.qmk.fm/
[Compose key]: https://en.wikipedia.org/wiki/Compose_key
[IME]: https://wiki.archlinux.org/title/Input_method
[IBus]: https://wiki.archlinux.org/title/IBus
[here's the commit]: https://tangled.org/crescentro.se/dotfiles/commit/a7b16ba7026d08d90c4739fc3c253e953039f411

[^1]: I will defend my use of the Mac layout forever, and there is literally nothing you can say or do to convince me otherwise.
