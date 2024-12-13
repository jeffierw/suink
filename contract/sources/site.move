/// Module: contract
module contract::suink;

use std::string::{Self, String};
use sui::address;
use sui::clock::{Self, Clock};
use sui::display;
use sui::package;
use sui::table::{Self, Table};

const VISUALIZATION_SITE: address = @0x1;

const BASE36: vector<u8> = b"0123456789abcdefghijklmnopqrstuvwxyz";

public struct Suink has key, store {
    id: UID,
    template: u64,
    b36addr: String,
    posts: Table<ID, Post>,
    pages: Table<ID, Page>,
}

public struct SUINK has drop {}

public struct Post has store {
    id: ID,
    content: String,
    published_at: u64,
}

public struct Page has store {
    id: ID,
    content: String,
}

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
        b"suink template address".to_string(),
        VISUALIZATION_SITE.to_string(),
    );
    display.update_version();

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
}

public entry fun create_site(template: u64, ctx: &mut TxContext) {
    let id = object::new(ctx);
    let b36addr = to_b36(id.uid_to_address());
    let suink = Suink {
        id,
        template,
        b36addr,
        posts: table::new<ID, Post>(ctx),
        pages: table::new<ID, Page>(ctx),
    };
    transfer::transfer(suink, ctx.sender());
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
