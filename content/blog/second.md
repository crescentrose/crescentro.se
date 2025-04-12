+++
title = "My second post"
date = 2025-04-10
+++

Just trying out some <mark class="primary">syntax highlighting</mark>! <mark class="quiet">(not that I wanted to anyway...)</mark> I think

## Rust

```rust, name=clock.rs, linenos, hl_lines=4 8-15
use std::sync::OnceLock;
use time::OffsetDateTime;

static CURRENT_TIME: OnceLock<Clock> = OnceLock::new();

#[derive(Debug, Clone, Copy)]
pub enum Clock {
    Wall,
    Mock(OffsetDateTime),
}

impl Clock {
    pub fn new() -> Self {
        Self::Wall
    }

    pub fn new_mock(mock_time: OffsetDateTime) -> Self {
        Self::Mock(mock_time)
    }

    pub fn now_utc(&self) -> OffsetDateTime {
        match self {
            Self::Wall => OffsetDateTime::now_utc(),
            Self::Mock(time) => *time,
        }
    }
}

pub fn now_utc() -> OffsetDateTime {
    CURRENT_TIME.get_or_init(Clock::default).now_utc()
}
```


This line is particularly sailent[^1].

## Nix

```nix,linenos,linenostart=5,hl_lines=4 8-15
{
  description = "streaming-heart";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    zen-browser = {
      url = "github:youwen5/zen-browser-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nixos-hardware.url = "github:NixOS/nixos-hardware";
  };

  outputs = inputs @ { self, nixpkgs, home-manager, nixos-hardware, ... }:
  let
    system = "x86_64-linux";
  in
  {
    nixosConfigurations = {
      streaming-heart = nixpkgs.lib.nixosSystem {
        inherit system;
        modules = [
          ./system.nix
            nixos-hardware.nixosModules.common-pc
            nixos-hardware.nixosModules.common-pc-ssd
            nixos-hardware.nixosModules.common-gpu-amd
            nixos-hardware.nixosModules.common-cpu-amd-pstate
            nixos-hardware.nixosModules.common-cpu-amd-zenpower
            home-manager.nixosModules.home-manager
            {
              home-manager = {
                users.ivan = import ./home.nix;
                extraSpecialArgs = inputs;
              };
            }
        ];
      };
    };
  };
}
```

That's all![^2]

[^1]: Allegedly.
[^2]: And this is a second footnote. A bit longer. Maybe it even includes a `sneaky bit of code`
    just to throw you off.

    And a line break.
