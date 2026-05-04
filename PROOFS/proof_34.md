Title: Link Deletion — 204 No Content
Demonstrated: DELETE /links/:id returns 204 with no response body on successful deletion
Technical detail: LinksController.deleteLink() is decorated with @HttpCode(HttpStatus.NO_CONTENT). The method calls deleteLinkByIdForOwner which verifies ownership, deletes from DB, and invalidates cache. 204 is the correct status for "action completed, nothing to return."
Proof: curl -X DELETE http://localhost:3000/links/clx... -H "x-api-key: api-key-1" → HTTP 204 (empty body). Subsequent GET /links/clx... → 404.
Reasoning: 204 (not 200 with empty JSON) follows RFC 7231 semantics and avoids clients attempting to parse an empty body as JSON.
