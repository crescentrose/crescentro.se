+++
title = "Crash course: Rust references, borrows, ownership and lifetimes"
description = "A quick introduction to how computers manage memory, what is a pointer, what are lifetimes, and how to deal with them."
date = 2026-02-11

[taxonomies]
categories = ["rust", "borrows"]

+++

## What's a computer?

Core parts of a computer:

1. something that stores data
2. something that executes instructions

This is the famous "Turing machine" (look it up).

---
## Prerequisite: Units

Computers understand 1s and 0s, or a _base 2_ (binary) system. Using one digit you can express $2^1 = 2$ values, and that's a _bit_. That's not a super useful quantity, so most often memory is measured with "bytes". One byte is 8 bits, which means it fits $2^8 = 256$ values.

Binary is annoying to deal with, so often times the hexadecimal (base 16) system is used.

---
## A simple memory model

What would you do if you had to remember things?

Most likely write it down, maybe in some sort of a notebook. And if you wanted to organize it, you could also number each page so you could refer to them later.

Congratulations, you've invented memory and addressing! Everything else is an abstraction.

---
## Using the memory

Let's say you wanted to calculate your age (thrilling, I know). How would you do it?

Well, you'd first need to write down the two current year and your birth year:

```
2026 - 1996
```

And then you'd be able to subtract the latter from the former, and write down the result:

```
2026 - 1996 = 30 
```

Now we have `30` stored in our memory!

---
## Reusing memory

Calculating just one person's age is kinda boring, so let's do something twice as fun and calculate two people's ages, like mine and my sister's. To start with, we just do the same thing:

```
2026 - 1996 = 30
```

However, we now _used_ the value for the current year. As in, if we just try to write "- 2000" in the next line, it would not really be obvious what we mean by that.

If we want to use it again, we have to **copy** it. This is just a four digit number, so we can do that quickly.

```
2026 - 1996 = 30 // my_age
2026 - 2000 = 26 // sister_age
```

---
## Pointing to memory

Copying is fine for smaller values we will only use a couple of times. But what if we had to calculate ages of multiple people precise to the day? Writing today's date over and over again would get tedious. It would also take a lot of space.

Maybe we can invent a way to refer to this number every time we calculate things?

```
🟪: February 10, 2026

🟪 - February 2, 1996 = 30
🟪 - April 30, 1997 = 28
🟪 - January 19, 1998 = 28
```

Here, we take 🟪 to be a *pointer* to the value of today's date. 

You can also say this is a "reference" to the date. There are technical differences between pointers and references, but none that you have to think about yet.

---
## Addresses

Each location in memory has an address, like a place. Unlike regular places, memory addresses are usually displayed as hexadecimal (base 16) numbers.

If you load the number 2026 to memory, it might be loaded at an address like `0x01`. So in our fictional notation this might look something like:

```
0x01: February 10, 2026

[0x01] - February 2, 1996 = 30
```

(On most modern CPUs, addresses will be much longer: 64 bits or 16 hexadecimal digits, e.g. `0x0123456789ABCDEF`).

---
## Variables

Using raw addresses every time would be quite inconvenient: they're not descriptive, you'd almost certainly overlap with another program, or you might even try to access memory that does not exist.

Instead, when coding, you will almost always give a human readable name to things you put into memory. 

```rust
let my_age = 30;
```

You are familiar with this as a "variable"

---
## Binding

Most beginners interpret this as "`my_age` is now `30`". That's not really the case. Instead, this is a shorthand for:

1. load `30` into a **place** in memory,
2. **bind** `my_age` to **the place** where we just loaded the number 30.

When you *mutate* a variable, it is still bound to the same place in memory, but the contents have changed:

```rust
let mut my_age = 30;
// time marches ever forth
my_age = 31;
```

Here, 30 does not exist in memory anymore - it was fully replaced by 31.

---
## Shadowing

If you *shadow* a variable, you reassign the name to a different *place* in memory:

```rust
let my_age = 30;
let my_age = 31;
```

In the above example, both 30 and 31 exist in memory. Sadly, 30 is unreachable as you have no name for it anymore. (This is a subtle Rust-specific feature.)

---
## Passing values to functions

When building programs you usually write lots of functions, or at least call them. Those functions usually take values or references.

If you pass a *value*, the function will operate on a copy of what you passed in. For example, in Python, numbers are passed *by value*:

```python
def add_one(x):
	x = x + 1
	
x = 1
add_one(x) 
print(x) # prints "1"
```

Python made a copy of your `x` so the original value remains the same.

---
## Passing references to functions

If you pass a *reference*, the function will operate directly on the variable you passed. Arrays (and objects) in Python are passed *by reference*:

```python
def extend(a):
	a.append("b")
	
a = []
extend(a)
print(a) # prints ['b']
```

Normally this is done because numbers can be copied quickly, while arrays might have many elements so copying it might take some time. (There's a more technical distinction here which I will save for later)

---
## Values and references in Rust

Python decides **for you**, and what it decides might not be what you want. Rust forces you to be explicit about what you're doing. This also means you can do things you can't do in Python.

A function either takes a value, or a reference to a value. References are indicated with an ampersand (`&`).

```rust
fn i_take_a_value(number: i32) {}
fn i_take_a_reference(number: &i32) {}
```

If a Rust function takes a variable "by value", we'd say it "takes ownership" of it. If it takes a reference, we also say we "borrow" to the function.

---
## Ownership 

In Rust, each value has an _owner_. You can only have **one** owner at a time. Once the value's owner disappears, the value disappears as well.

```rust
fn main() {
	let my_name = String::from("Ivan");
	// my_name is now owned by `main`
	
	say_hi(my_name);
	// ownership passed to `say_hi`

	// println!("{my_name}")
	// ^-- this will NOT work
	//   because we gave ownership to `say_hi`, and it dropped the value!
}


fn say_hi(name: String) {
	// we receive ownership of `name` here
	println!("{name}");
	
	// `name` is DROPPED here because we do not pass it back to anyone.
	// it will be removed from memory
}
```

---
## Clone

If we want to **duplicate** the value, we can (usually) `clone` it, like so:

```rust
fn main() {
	let my_name = String::from("Ivan");
	// my_name is now owned by `main`
	
	say_hi(my_name.clone());
	// duplicate `my_name` and pass the ownership of that new value to `say_hi`

	println!("{my_name}")
	// ^-- this now works!
}


fn say_hi(name: String) {
	println!("{name}");
}
```

This now takes double the memory, but it compiles.

---
## Copy

Some values are so small that cloning them repeatedly would just be annoying. The compiler will transparently copy these values for you. This is the Rust equivalent of "passing by value".

```rust
fn add_one(num: i32) {
	let num = num + 1;
	println!("{num}");
}

fn main() {
	let num = 1;
	add_one(num); // prints "2"
	add_one(num); // prints "2" again because `num` was copied
	println("{num}") // prints "1" because `add_one` received a copy.
}
```

You can tell which types need to be cloned and which need to be copied by the traits they implement: `i32` implements `Copy` while `String` implements `Clone`. As a rule of thumb, numbers and fixed-size arrays are `Copy`, while larger values like strings and vectors are `Clone`.

It is good practice to `#[derive(Clone, Copy)]` on your types that contain only other `Copy` types.

---
## Borrowing

Often times you want to avoid duplicating values. Either they are large, or it is just unnecessary to do so.

You can borrow a value by prefixing it with an `&`. Likewise, you can indicate a borrowed type by prefixing the type with an `&`.

```rust
fn say_hi(name: &String) { // <- take a reference to `name`
	println!("{name}")
}

fn main() {
	let name = String::from("Ivan");
	say_hi(&name) // <- create a reference to `name` and pass it to `say_hi`
	println!("{name}") // since we only made a reference, we still own the value!
}
```

---
## Generalizing borrows

Using `&String` works fine and does what it's supposed to do. However, you will more commonly see `&str` to indicate a borrowed string. Both work the same, but the latter is a bit more flexible.

Likewise, while `&Vec<T>` is valid, `&[T]` is preferred for the same reason in most cases.

You don't have to worry about the details now, and you can get by with a mental model of these two as "exceptions" to how you'd normally define a reference.

---

## Dereferencing

You already know you can create a reference with an `&`:

```rust
let x: i32 = 10;  // types added for clarity
let y: &i32 = &x; // you do not normally need to write them
```

If you want to get back to the original value, you can _dereference_ with `*`:

```rust
let z = *y;
println!("{z}"); // prints "10"
```

The compiler will do this for you automatically in many cases, and will otherwise tell you that you need to do it yourself, like in the next example.

---
## Mutable borrowing

When you **borrow** a value, you can **only** read from it. You can have many read-only borrows.

If you want to **change** the value, you need a **mutable borrow**. You can create one with `&mut`.

```rust
fn celebrate_birthday(age: &mut i32) {
    *age += 1; // note the dereference here!
               // `age` is a reference to a value.
               // we want to operate on the value, not the reference itself
    println!("Happy birthday!");
}

fn main() {
    let mut age = 29;
    celebrate_birthday(&mut age);
    println!("You are now {age} years old.") // prints "You are now 30 years old."
}
```

---
## Rules of mutable borrowing

You can have either **many** read-only borrows, ***OR*** **one single** mutable borrow.

You cannot have both a mutable and an immutable borrow at a same time. Just think about how annoying it would be to try and calculate someone's age while someone else is rewriting today's date to be something else.

It is possible to avoid some of these rules in certain situations, even in safe code, but we won't cover those here.

---
## Invalid references

Since references and the values they reference are independent, you can imagine a situation where you create a reference to something that no longer exists. This is fairly easy to do in a language like C, and results in "undefined behavior". 

```c
#include <stdio.h>

int* make_reference() {
	int x = 10;
	return &x;
}

void main() {
	int* y = make_reference(); // `y` is now a reference to `x`, which we dropped
	// therefore it points to an address in memory that we do not have access to anymore
	
	printf("%d", *y); // Program terminated with signal: SIGSEGV
}
```

---
## Undefined behavior

Undefined behavior means the compiler is allowed to do **literally anything**: crash the program, crash your computer, delete your photos, or set your car on fire. For that reason undefined behavior is also sometimes called "nasal demons".

If you suggest to certain people we should try to avoid issues like this, you will commonly get a smug response along the lines of "well personally I would simply have coded it better". This likewise provokes undefined behavior from Rust developers.

---
## Lifetimes

Rust has a _borrow checker_ which enforces something called _lifetimes_. A borrow has a _lifetime_ beyond which it is invalid. The compiler will prevent you from using a reference to something that may not still exist.

```rust
fn main() {
	let y = {
		let x = 10;
		&x // y is now a reference to x ...
	}; // ... but x has been dropped at the end of this block
	
	// error[E0597]: `x` does not live long enough
	
	println!("{y}"); // <- the compiler will not even consider this line
}
```


---
## Defining a lifetime of a variable

Lifetimes are usually labeled with a single quote mark (`'`), like `'a` or `'mylifetime`. Most people use single-character labels, but sometimes you will encounter more descriptive names. 

```rust
let x: i32 = 10;
let y: &'a i32 = &x; // <- unnecessarily verbose
```

---
## Defining a lifetime of a function parameter

In functions, lifetime parameters are declared as generics (we say that a function is _generic over lifetime `'a`_).

```rust
fn get_first_letter<'a>(text: &'a str) -> &'a str { // <- unnecessarily verbose
    &text[0..1]
}

fn main() {
    let text = String::from("Hello!");
    let first_letter = get_first_letter(&text);
    
    println!("{first_letter}"); // prints "H"
}
```

In the `get_first_letter` function we declare that the output of this function must live *at least* as long as its parameter `text`. In other words, if we drop `text` at any future point in the program, we must have first dropped `first_letter`. 

In the vast majority of cases the compiler will do this for you. This is known as "lifetime elision". Usually you will only have to define lifetimes when you're doing something slightly weird like holding on to references in structs.

---
## Static lifetime

There's a special lifetime called `'static`. `'static` means "this value lives for the rest of the program". The easiest way to create it is to use a string literal.

```rust
let greeting: &'static str = "Hello, world!";
```

This string is stored in our program when it's compiled, so it will always be valid (We have to load the program into memory to execute it, and altering a program's image as it's running is frowned upon these days).

---
## Leaking data

You can create a `'static` value by _leaking_ it. This means that it will stick around until your program terminates and the OS cleans up its memory. 

```rust
fn get_first_letter<'a>(text: &'a str) -> &'a str {
    &text[0..1]
}

fn main() {
    let first_letter = {
        let text: &'static str = String::from("Hello!").leak(); // lives forever!
        get_first_letter(text) // `text` is already a reference
						       // we do not need to pass a reference to a reference
    };
    
    // `text` is inaccessible here but it still exists in memory, so references
    // to it are still valid.
    println!("{first_letter}");
}
```

Leaking is aptly described in the [Rustonomicon](https://doc.rust-lang.org/nomicon/leaking.html) with the words "Everything is terrible and we have new and exotic problems to try to solve."

---
## Lifetimes are hard

Lifetimes are often seen as the "final boss" of Rust and many people find it hard to wrap their heads around them at first. In your first few weeks it makes sense to work with mostly owned values, borrows when it makes sense, and resort to cloning when lifetime issues pop up.

Lifetimes exist in all languages, but Rust is one of the very few ones that exposes them and makes them a first-class citizen of the language.

---
## Stack and heap

So far we've considered memory as one big happy bucket of things. This is only partly accurate.

There are two types of memory: the **stack** is a structured collection of data which has a known, fixed size. For example, an `i64` will always be 64 bits long. Using the stack is pretty fast, because you always know what's the next available location.

The **heap** stores larger, unstructured data that can be of variable size, like a `String` or a `Vec`. You request a certain size and a system called an *allocator* looks for a large enough gap in memory that can fit this.

Think of a stack like a carefully ordered pile of books and the heap like that pile of clothes next to your bed that you will surely clean up this weekend.

---
## Allocations

Because the **stack** is very structured, and data on the heap has to be allocated, tracked and eventually freed, ownership and lifetimes mainly concern managing heap allocations.

Likewise, this is the main distinction between `Clone` and `Copy` types. In general, `Copy` types are the ones that live on the stack. `Clone` types require a call to the allocator (or, occasionally, another system).

This assumption does not always hold: a fixed-size array of 4096 `i64`s is larger and takes longer to copy than it takes to clone a string of 5 characters. The Rust compiler team is thinking hard about making this more obvious literally as we speak.

---
## Box

If you want to force something to be allocated on the heap, you can [box that value](https://doc.rust-lang.org/std/boxed/index.html). 

```rust
let boxed: Box<i32> = Box::new(10); // move to the heap
let val = *boxed; // push back on the stack
```

This could be situationally useful, mainly when dealing with types of unknown sizes, which probably doesn't make sense to you right now, but will eventually. For now it's enough you remember that a `Box` is just a container for something placed on the heap.

---
## Size of a type

Each type has a size. You can find it with the [`size_of`](https://doc.rust-lang.org/std/mem/fn.size_of.html) function. The type is passed in the [turbofish](https://turbo.fish/about) (`::<>` kinda looks like a fish).

```rust
size_of::<i32>(); // => 4 (bytes)
size_of::<i64>(); // => 8
```

Every time you create an `i32`, you will use 4 bytes of memory.

---
## Size of an allocated type

Types that allocate memory, like `String`, have a known size as well, even though they refer to an arbitrarily large amount of memory on the heap.

```rust
size_of::<String>(); // => 24
```

The size of the allocation is not included in the size of the type. The type itself only contains a reference to the area of memory where your data is actually kept.

You could say that `String` has 24 bytes of *overhead* on top of however much space you need to allocate for the contents.

---
## Zero-sized types

You can have types that consume *no* memory at all.

```rust
struct Foo;
size_of::<Foo>(); // => 0
```

This is sometimes useful for marker types, organizing code, and abstractions. 

---
## Dynamically sized types

You can have types of unknown size. Sometimes this is due to [dynamic dispatch](https://doc.rust-lang.org/book/ch20-03-advanced-types.html?highlight=dyn#dynamically-sized-types-and-the-sized-trait), which is out of scope of this guide. More commonly you will encounter this with slices.

```rust
fn say_hi(name: &str) {
	// how big is `name`?
	// could be 10 characters, could be 100, could be a million!
}
```

In the above example, `&str` will not just point to the slice, but also carry with it the _size_ of that slice. This is affectionately known as a "fat pointer".

In some other use cases, like dynamic dispatch, you'd put the value in a `Box`, which would then act as a pointer.

---
## Smart pointers

Just like `&`, `Box` is a way to refer to an area of memory you do not necessarily own. Unlike `&`, `Box` is a [smart pointer](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html). 

There are other smart pointers that let you do more interesting things: for example, bend the Rust ownership rules and allow multiple owners, or allow you to mutate values that have not been declared as mutable (_interior mutability_). 

---
## Reference counting

[`Rc`]([https://doc.rust-lang.org/std/rc/struct.Rc.html](https://doc.rust-lang.org/std/rc/index.html)) is a reference counting smart pointer. It pushes the concerns of ownership and borrowing to runtime. You can clone it quickly and each clone will point to the same memory. And you do not have to think about where it is used, as it knows how to clean up behind itself once it's no longer used anywhere. In other words, it's kinda like working with Python.

```rust
use std::rc::Rc;

fn say_hi(name: &str) {
    println!("Hi, {name}!");
}

fn main() {    
    let name = {
	    let my_name = Rc::new(String::from("Ivan"));
	    my_name.clone() // we can create a new reference by cloning the `Rc`.
    }; // even though `my_name`, the original reference, is dropped here...
    say_hi(&name.clone()); // ... we still have access to the underlying data
}
```

There's a little bit of overhead involved with `Rc` and it can make code a little bit more messy, but sometimes it is the simplest way to achieve what you need to do.

---
## Atomic reference counting

`Rc` is not _thread safe_. That is, if you write programs that make use of many cores at once, you cannot use `Rc` for data that is shared between different threads.

For that, you can use the creatively named [`Arc`](https://doc.rust-lang.org/std/sync/struct.Arc.html). It has some extra overhead as it needs to synchronize between threads.

Async Rust is outside of the scope of this guide so I will not go in depth about it, but you should know it exists.

---
## Pinning

Normally, the compiler is allowed to transparently move values between uses or borrows, for whatever reason.

```rust
fn print_addr(num: &i32) {
	// prints the actual address of the value
    println!("{:?}", std::ptr::addr_of!(*num)); 
}

fn main() {
    let age = 30;
    print_addr(&age); // prints something like "0x7ffd719d98d0"
    (move || {
        print_addr(&age); // prints something like "0x7ffd719d98d4"
    })();
}
```

This is annoying if you're relying on something being in the same place in memory as you left it - for example, if you are running a background task that you want to come back to after an indeterminate amount of time has passed.

This is why [`Pin`](https://doc.rust-lang.org/std/pin/index.html) exists - if you pin a value, the compiler will guarantee that it will **not move**:

```rust
let age = std::pin::pin!(30);
print_addr(&age); // 0x7ffea98694a4
(move || {
	print_addr(&age); // 0x7ffea98694a4 - same as above.
})();
```

If lifetimes are the final boss of Rust, `Pin` is the post-game DLC boss that requires 100% completion before you consider approaching it and demands deep understanding of the underlying systems. It also underpins (hehe) the entire async Rust ecosystem, so eventually it will be important for you to understand it. For now, it is enough you know that it exists, as a curiosity.
