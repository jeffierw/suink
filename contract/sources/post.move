module contract::post;

use std::string::{Self, String};
use sui::clock::Clock;

public struct Post has key, store {
    id: UID,
    site: ID,
    title: String,
    content: String,
    version: u8,
    published_at: u64,
    updated_at: Option<u64>,
}

const ErrorDataTooLong: u64 = 0;
const ErrorNotMatchSite: u64 = 1;

#[allow(lint(self_transfer))]
public(package) fun create_post(
    site: ID,
    title: String,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
): (ID, address, String) {
    assert!(string::length(&title) <= 256, ErrorDataTooLong);
    assert!(string::length(&content) <= 256, ErrorDataTooLong);

    let _post = Post {
        id: object::new(ctx),
        site,
        title,
        content,
        version: 0,
        published_at: clock.timestamp_ms(),
        updated_at: option::none(),
    };
    let id = _post.id.to_address();
    let post_id = _post.id.to_inner();
    transfer::public_transfer(_post, ctx.sender());
    (post_id, id, title)
}

public(package) fun update_post(
    site: &ID,
    post: &mut Post,
    title: String,
    content: String,
    clock: &Clock,
): (ID, address, String) {
    assert!(site == &post.site, ErrorNotMatchSite);
    assert!(string::length(&title) <= 256, ErrorDataTooLong);
    assert!(string::length(&content) <= 256, ErrorDataTooLong);
    assert!(post.version <= 255, ErrorDataTooLong);
    post.title = title;
    post.content = content;
    post.version = post.version + 1;
    post.updated_at = option::some<u64>(clock.timestamp_ms());
    (post.id.to_inner(), post.id.to_address(), title)
}

public(package) fun delete_post(post: Post): ID {
    let Post { id, site: _, title: _, content: _, version: _, published_at: _, updated_at: _ } =
        post;
    let post_id = id.to_inner();
    id.delete();
    post_id
}
