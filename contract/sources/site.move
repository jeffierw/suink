/// Module: contract
module contract::suink;

use contract::page::{Self, Page};
use contract::post::{Self, Post};
use std::string::{Self, String};
use sui::address;
use sui::clock::Clock;
use sui::display;
use sui::event;
use sui::package;
use sui::table::{Self, Table};

const VISUALIZATION_SITE: address =
    @0x6e85268221ff151cbfbc50abc585c0e94f3b31c67c5e55f11e5ff300226187e0;

const BASE36: vector<u8> = b"0123456789abcdefghijklmnopqrstuvwxyz";

public struct Suink has key, store {
    id: UID,
    name: String,
    metadata: String,
    b36addr: String,
    posts: Table<address, String>,
    pages: Table<address, String>,
}

public struct SUINK has drop {}

public struct SiteCreated has copy, drop {
    id: ID,
    owner: address,
}

public struct SiteUpdated has copy, drop {
    id: ID,
    owner: address,
}

public struct PostOrPageCreated has copy, drop {
    id: ID,
    owner: address,
    postOrPage: address,
}

public struct PostOrPageUpdated has copy, drop {
    id: ID,
    owner: address,
    postOrPage: address,
}

public struct PostOrPageDeleted has copy, drop {
    id: ID,
    owner: address,
}

const ErrorDataTooLong: u64 = 0;

fun init(otw: SUINK, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);
    let mut display = display::new<Suink>(&publisher, ctx);

    display.add(
        b"link".to_string(),
        b"https://{b36addr}.walrus.site".to_string(),
    );
    display.add(
        b"image_url".to_string(),
        b"https://aggregator.walrus-testnet.walrus.space/v1/ujiEMLPABJMXKhr47e_N71aX3Z4D-FJeJ0df3S9qd6M".to_string(),
    );
    display.add(
        b"walrus site address".to_string(),
        VISUALIZATION_SITE.to_string(),
    );
    display.update_version();

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
}

public entry fun create_site(name: String, metadata: String, ctx: &mut TxContext) {
    assert!(string::length(&name) <= 255, ErrorDataTooLong);
    let uid = object::new(ctx);
    let id = uid.to_inner();
    let b36addr = to_b36(uid.uid_to_address());
    let suink = Suink {
        id: uid,
        name,
        metadata,
        b36addr,
        posts: table::new<address, String>(ctx),
        pages: table::new<address, String>(ctx),
    };
    transfer::transfer(suink, ctx.sender());
    event::emit(SiteCreated {
        id,
        owner: ctx.sender(),
    });
}

public entry fun update_site(
    site: &mut Suink,
    name: String,
    metadata: String,
    ctx: &mut TxContext,
) {
    assert!(string::length(&name) <= 255, ErrorDataTooLong);
    site.name = name;
    site.metadata = metadata;
    let id = site.id.to_inner();
    event::emit(SiteUpdated {
        id,
        owner: ctx.sender(),
    });
}

public entry fun create_post(
    site: &mut Suink,
    title: String,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let id = site.id.as_inner();
    let (post_id, address, title) = post::create_post(*id, title, content, clock, ctx);
    site.posts.add(address, title);
    event::emit(PostOrPageCreated {
        id: post_id,
        owner: ctx.sender(),
        postOrPage: address,
    });
}

public entry fun create_page(
    site: &mut Suink,
    title: String,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let id = site.id.as_inner();
    let (page_id, address, title) = page::create_page(*id, title, content, clock, ctx);
    site.pages.add(address, title);
    event::emit(PostOrPageCreated {
        id: page_id,
        owner: ctx.sender(),
        postOrPage: address,
    });
}

public entry fun update_post(
    site: &mut Suink,
    post: &mut Post,
    title: String,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let site_id = site.id.as_inner();
    let (post_id, address, title) = post::update_post(site_id, post, title, content, clock);
    if (site.posts.contains(address)) {
        let old_title = site.posts.borrow_mut(address);
        *old_title = title;
    };
    event::emit(PostOrPageUpdated {
        id: post_id,
        owner: ctx.sender(),
        postOrPage: address,
    });
}

public entry fun update_page(
    site: &mut Suink,
    page: &mut Page,
    title: String,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let site_id = site.id.as_inner();
    let (page_id, address, title) = page::update_page(site_id, page, title, content, clock);
    if (site.pages.contains(address)) {
        let old_title = site.posts.borrow_mut(address);
        *old_title = title;
    };
    event::emit(PostOrPageUpdated {
        id: page_id,
        owner: ctx.sender(),
        postOrPage: address,
    });
}

public entry fun delete_post(site: &mut Suink, post: Post, ctx: &mut TxContext) {
    let id = post::delete_post(post);
    if (site.posts.contains(id.to_address())) {
        site.posts.remove(id.to_address());
    };
    event::emit(PostOrPageDeleted {
        id,
        owner: ctx.sender(),
    });
}

public entry fun delete_page(site: &mut Suink, page: Page, ctx: &mut TxContext) {
    let id = page::delete_page(page);
    if (site.pages.contains(id.to_address())) {
        site.pages.remove(id.to_address());
    };
    event::emit(PostOrPageDeleted {
        id,
        owner: ctx.sender(),
    });
}

public fun to_b36(addr: address): String {
    let source = address::to_bytes(addr);
    let size = 2 * vector::length(&source);
    let b36copy = BASE36;
    let base = vector::length(&b36copy);
    let mut encoding = vector::tabulate!(size, |_| 0);
    let mut high = size - 1;

    source.length().do!(|j| {
        let mut carry = source[j] as u64;
        let mut it = size - 1;
        while (it > high || carry != 0) {
            carry = carry + 256 * (encoding[it] as u64);
            let value = (carry % base) as u8;
            *&mut encoding[it] = value;
            carry = carry / base;
            it = it - 1;
        };
        high = it;
    });

    let mut str: vector<u8> = vector[];
    let mut k = 0;
    let mut leading_zeros = true;
    while (k < vector::length(&encoding)) {
        let byte = encoding[k] as u64;
        if (byte != 0 && leading_zeros) {
            leading_zeros = false;
        };
        let char = b36copy[byte];
        if (!leading_zeros) {
            str.push_back(char);
        };
        k = k + 1;
    };
    str.to_string()
}
