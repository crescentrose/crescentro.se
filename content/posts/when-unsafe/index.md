+++
title = "When is a Rust function \"unsafe\"?"
description = "Exploring obvious and controversial usages of the infamous unsafe keyword, and how can we iterate on it."
date = 2025-06-09

[taxonomies]
categories = ["rust", "programming", "long"]

[extra]
featured = true
+++

The `unsafe` keyword is an escape hatch from Rust's guarantees. According to [the book](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html#unsafe-superpowers), it gives you the following powers:

> - Dereference a raw pointer
> - Call an unsafe function or method
> - Access or modify a mutable static variable
> - Implement an unsafe trait
> - Access fields of a `union`

`unsafe` usage is commonly tied to "doing weird things with memory" that might or might not be [sound](https://doc.rust-lang.org/reference/behavior-considered-undefined.html#r-undefined.soundness). For example, think of [writing to a VGA text buffer](https://en.wikipedia.org/wiki/VGA_text_mode#Access_methods). In the context of [making your own OS kernel](https://os.phil-opp.com/vga-text-mode/), it might be perfectly fine to take a raw pointer to `0xb8000` and start writing bytes into it. However, if you run that exact same code outside the kernel (in [user space](https://en.wikipedia.org/wiki/User_space_and_kernel_space)), you will run into [undefined behavior](https://doc.rust-lang.org/reference/behavior-considered-undefined.html). What happens next is most likely an unceremonious [segmentation fault](https://en.wikipedia.org/wiki/Segmentation_fault), but your program could just as well silently keep running after corrupting memory or doing something equally bad.

Messing with memory you do not own is not the only type of undefined behavior, though. You may also produce an [invalid value](https://doc.rust-lang.org/reference/behavior-considered-undefined.html#invalid-values). Taking `bool`s as an example, [in memory](https://doc.rust-lang.org/reference/types/boolean.html#r-type.bool.repr), `false` is stored as `0x00` and `true` as `0x01`. Since a `bool` has a [size of 1](https://doc.rust-lang.org/reference/type-layout.html#r-layout.properties.size), this leaves us with 7 unused bits to play around with. If we try to interpret `0x80` as a `bool` using [`std::mem::transmute`](https://doc.rust-lang.org/std/mem/fn.transmute.html), we will [ostensibly get `false` out](https://play.rust-lang.org/?version=stable&mode=release&edition=2024&gist=03cd128ed7d95de993b42392c141256a). But running this on a different architecture or a different compiler version or during a different moon phase might return `true`, `segmentation fault`, or trigger a [Ferris](https://rustacean.net/) jump-scare.

This begs the question - as I am writing my blazing fast AI-powered distributed to-do list item checkbox micro-service on edge compute, when is it appropriate to declare a function as `unsafe`?

There are conflicting opinions on this even in the scope of the official documentation. The [`std` documentation](https://doc.rust-lang.org/std/keyword.unsafe.html#the-different-meanings-of-unsafe) has a very simple explanation: a function is unsafe if "calling this function means abiding by a contract the compiler cannot enforce". According to this definition, this is valid usage of the `unsafe` keyword:

```rust
/// # Safety
/// Only call this method if tomorrow's weather forecast
/// for a given location is sunshine.
unsafe fn weather_forecast_for(_lat: f64, _long: f64) -> &'_ str {
    "It will be sunny tomorrow!"
}
```

However, the [Rust reference](https://doc.rust-lang.org/reference/unsafety.html) clearly defines unsafe operations as those that can "potentially violate the memory-safety guarantees of Rust’s static semantics", and goes on to explain that [unsafe functions](https://doc.rust-lang.org/reference/unsafe-keyword.html#r-unsafe.fn) are "functions that are not safe in all contexts and/or for all possible input". Thus, the reference only concerns itself with memory safety. According to this definition, the following function does not deserve to be marked as `unsafe`:

```rust
/// Make sure you're pouring the acidic solution into water rather
/// than the other way around, otherwise magic smoke might appear.
fn mix_contents(src: &Tank, dst: &Tank) -> Result<DilutedAcid, !> {
    todo!()
}
```

This aligns with [The Rust Programming Language](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html#unsafe-rust), which claims that "if you use unsafe code incorrectly, problems can occur due to memory unsafety" - but not due to any other reason.

To make things more confusing, the [FLS](https://rust-lang.github.io/fls/unsafety.html), which, to my understanding, is an unofficial-but-kinda-official language spec owned by the Rust organization that may or may not be authoritative, defines an unsafe operation as "an operation that may result in undefined behavior that is not diagnosed as a static error". So, anything in the aforementioned [list of UB](https://doc.rust-lang.org/reference/behavior-considered-undefined.html) is fair game, but only that.

Who's right? Below I have written out some of my own observations, which may or may not be right, as people tend to have strong opinions on this. After looking at the obvious and controversial usages of `unsafe`, I'd like to propose a solution that is probably very bad, so that someone online can tell me exactly how stupid I am and propose something much better, and hopefully cause other people to pile on and eventually reach a workable answer to this question.

## Obvious: Can access data it should not

This is probably the least controversial use case for `unsafe` - if your function does [something silly](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html#listing-20-3) like dereferencing a raw pointer passed into it, you're deeply in `unsafe` territory and your function should obviously be marked as such. A good example of that in standard library is [`std::slice::from_raw_parts`](https://doc.rust-lang.org/std/slice/fn.from_raw_parts.html).

## Obvious: Can break data layout

As explained above, you can use a function like [`std::mem::transmute`](https://doc.rust-lang.org/std/mem/fn.transmute.html) to reinterpret data as something that really doesn't fit said data. For example, you could interpret a `Vec<u8>` as a `String` even if it does not contain valid UTF-8. This would break `String` and is, therefore, unsafe.

## Obvious: Uses foreign function interfaces

This is another pretty simple one. All functions that are a part of a foreign library developed in another language will be `unsafe`, because the Rust compiler does not know what's going on inside of them and cannot guarantee memory safety. When developing a library wrapping foreign code, you are supposed to take those function signatures and wrap them in safe interfaces. [The Rustonomicon has a detailed how-to](https://doc.rust-lang.org/nomicon/ffi.html) on that.

## Less obvious: Contains assumptions about the runtime environment

In Rust 2024, the [`std::env::set_var`](https://doc.rust-lang.org/edition-guide/rust-2024/newly-unsafe-functions.html#stdenvset_var-remove_var) function was marked as unsafe because using it could lead to data races in multithreaded programs. I have to admit that the details of why precisely this is unsafe escape me, despite [many excellent](https://www.evanjones.ca/setenv-is-not-thread-safe.html)  [explanations available](https://rachelbythebay.com/w/2017/01/30/env/). However, this is, to my (lackluster) knowledge, the first `unsafe` function in the standard library whose safety depends on the environment in which you are executing it.

You could potentially make an argument for the [SIMD functions](https://doc.rust-lang.org/core/arch/x86_64/index.html) being another example, but those will fail to compile if your target architecture does not have support for SIMD. On the other hand, you could take perfectly safe, multi-threaded, usage of `std::env::set_var` on Windows, and the exact same code compiled for macOS would be unsafe.

Theoretically this function should then only be unsafe for POSIX systems that are built with affected `libc` implementations. I am sure there was a long and elaborate discussion about this that resulted in a very salient argument for why exactly it should be marked as `unsafe` everywhere. Whatever the outcome, this function is definitely _weird_.

## Contentious: breaks runtime invariant

A couple of months ago I read [The ultimate guide to Rust newtypes](https://www.howtocodeit.com/articles/ultimate-guide-rust-newtypes#bypassing-newtype-validations), which, among other things, had a section on bypassing newtype validations. To summarize, let's say you have an `EmailAddress` type. You want to be sure that this is a valid email address (let's disregard the [futility of such an endeavor](https://beesbuzz.biz/code/439-Falsehoods-programmers-believe-about-email) for now), so you make sure to validate the input in a constructor or a `TryFrom` impl, and if you get back an `Ok(EmailAddress)`, you can happily save it in your database.

However, when you read from the database, it does not make a lot of sense to re-do this work, as your database should only have valid email addresses. Therefore, you sneak in a little backdoor in the form of `unsafe fn new_unchecked()` that lets you build this type from a string that's assumed to be valid.

This is not _technically_ unsafe. You cannot trigger undefined behavior from safe code (compiler bugs notwithstanding), and since there are no `unsafe` blocks in your `fn new_unchecked()`, whatever happens will not result in undefined behavior. Sure, you might get a panic, or logic errors, or some issue, but you will never violate the memory rules.

However, you could also argue that, since producing an invalid value _is_ undefined behavior, and the validity of a value includes a requirement for [the value to be in the range of valid values](https://doc.rust-lang.org/reference/behavior-considered-undefined.html#invalid-values), you _could_ argue that creating an `EmailAddress("poop")` is, in fact, undefined behavior.

Personally, I'd say this should not be `unsafe`, and my main argument for this would be that [`serde::Deserialize`](https://docs.rs/serde/latest/serde/trait.Deserialize.html) is not an `unsafe` trait, even though it can be used to construct invalid values on types if the implementation of `Deserialize` is not sound. However, there are many people smarter than me who disagree. 

## Contentious: lets you shoot yourself in the foot (metaphysically)

Here's a very safe function:

```rust
async fn create_post(
    db: &PgPool, author: i32, contents: &str
) -> Result<(), DatabaseError> {
    let stmt = format!(
        r#"INSERT INTO posts(author, contents)
        VALUES({author}, '{contents}')"#
    );

    sqlx::query(stmt)
        .execute(&pool)
        .await?;
    Ok(())
}
```

You were, of course, yelling at your screen by the time you saw the `format!` macro slide in. Or maybe you were not. Maybe you never worked with `sqlx` or databases in general, or you are just tired, so you did not notice that you can [pass something like `'); DROP TABLE posts; -- `](https://owasp.org/www-community/attacks/SQL_Injection) as the value of `contents`.

Or your colleague wrote this function at some point in time in which only trusted users could execute it, but now the requirements changed and anyone should be able to make posts, Claude found this method, you were mindlessly accepting the output of the LLM because it looks right, this method didn't come up in the PR review, and now you have a nice new entrypoint to your system.

I hear you - "skill issue, pay attention, skill issue, learn to code!". But is this not the exact attitude we mock C++ developers for? If [Python could solve this issue](https://www.psycopg.org/docs/sql.html) with its anemic type system, surely we should be able to at least slap an `unsafe` on this function to make sure you acknowledge the ways it could screw you over?

## Contentious: Lets you shoot yourself in the foot (literally)

I suggested this at the start of the article - perhaps you are writing code that does something in the real world beyond just lighting up pixels on a screen. Perhaps some of those operations are perfectly fine, and perhaps some are actively dangerous to property or life if some real-world preconditions are not met.

A dumb example I have from my own experience is writing Linux USB drivers for a smart [desk lamp](https://nanoleaf.me/en-EU/products/pegboard-desk-dock/?size=1) (yes, I know I make bad purchasing decisions). If you blast pure white at maximum brightness out of this thing, you will (a) burn out your retinas and (b) for some reason, crash it and force it to reset after a couple of seconds. I am yet to determine if this could somehow permanently mess up the device, but I would definitely label the function that sends the bytes down the wire as unsafe.

There are thousands of other examples here that you could think of. Should a function that cuts power to a car's engine be `unsafe` because we want to be sure we are stopped first? What about a function that sends power to a battery so that it can be recharged, because we can't know if the battery is too hot or too full? Everything is computer, and these questions will just pile on as Rust becomes more widely used in embedded systems.

## Suggestion: `unsafe` contexts

I promised a bad idea at the start, and it's been two thousand words, so you have earned it. Keep in mind, this is a complete piece of outsider art, and there might already be proposals that address this issue in a much better way. All I want to do here is to start the discussion if it is already not started.

~~Stealing~~ Building on [Boats' idea of the registers of Rust](https://without.boats/blog/the-registers-of-rust/), I'd suggest the ability to annotate an `unsafe` function with an explanation of _why_ is it unsafe. Then, at point of use, you'd be able to limit the usage of `unsafe` to the contexts that you're happy with.

Perhaps we'd start with a couple of predefined ones, and then you'd be able to extend those with your own, or perhaps we'd settle on a couple of contexts that just make sense for most use cases. Either way, I imagine it might look something like this:

```rust
#[unsafe(context = data_race)]
unsafe fn get_mut_unchecked() {}

#[unsafe(context = breaks_invariant)]
unsafe fn new_unchecked() {}

#[unsafe(context = bodily_harm)]
unsafe fn actuate_knife() {}

#[allow(unsafe, context = data_race, breaks_invariant)]
unsafe {
	new_unchecked(); // works
	get_mut_unchecked(); // works
	actuate_knife(); // compiler error
}
```

This way, we let the author decide what is actually unsafe in the context of their code, and we can decide for ourselves what is our level of risk tolerance. Yes, it would still be annoying to have to wrap something you consider safe in an `unsafe` block just because someone else thinks that you can't be trusted with a function that executes raw SQL on a database. But at least you could sleep better knowing that usage of `unsafe` functions in that particular block is limited only to the functions whose safety you addressed or which you do not consider unsafe.

In conclusion, Rust sucks and this is why I am going back to COBOL.
