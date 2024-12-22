module contract::page;

use std::string::{Self, String};
use sui::clock::Clock;

public struct Page has key, store {
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
public(package) fun create_page(
    site: ID,
    title: String,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
): (ID, address, String) {
    assert!(string::length(&title) <= 256, ErrorDataTooLong);
    assert!(string::length(&content) <= 256, ErrorDataTooLong);

    let _page = Page {
        id: object::new(ctx),
        site,
        title,
        content,
        version: 0,
        published_at: clock.timestamp_ms(),
        updated_at: option::none(),
    };
    let id = _page.id.to_address();
    let page_id = _page.id.to_inner();
    transfer::public_transfer(_page, ctx.sender());
    (page_id, id, title)
}

public(package) fun update_page(
    site: &ID,
    page: &mut Page,
    title: String,
    content: String,
    clock: &Clock,
): (ID, address, String) {
    assert!(site == &page.site, ErrorNotMatchSite);
    assert!(string::length(&title) <= 256, ErrorDataTooLong);
    assert!(string::length(&content) <= 256, ErrorDataTooLong);
    assert!(page.version <= 255, ErrorDataTooLong);
    page.title = title;
    page.content = content;
    page.version = page.version + 1;
    page.updated_at = option::some<u64>(clock.timestamp_ms());
    (page.id.to_inner(), page.id.to_address(), title)
}

public(package) fun delete_page(page: Page): ID {
    let Page { id, site: _, title: _, content: _, version: _, published_at: _, updated_at: _ } =
        page;
    let page_id = id.to_inner();
    id.delete();
    page_id
}
