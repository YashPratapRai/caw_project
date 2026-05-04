Title: Input Sanitization — ValidationPipe with Whitelist
Demonstrated: Unknown fields in POST /links body are silently stripped; non-whitelisted fields trigger 422
Technical detail: NestJS ValidationPipe configured with whitelist:true (strips unknown props), forbidNonWhitelisted:true (rejects if unknown props present), transform:true. enableImplicitConversion is explicitly false to prevent type coercion attacks.
Proof: curl -X POST /links -d '{"long_url":"https://example.com","admin":true}' → HTTP 422 {"error":"property admin should not exist"}
Reasoning: forbidNonWhitelisted prevents mass-assignment attacks where an attacker sends admin:true or role:"superuser" hoping the ORM blindly persists it. This mirrors Rails' strong parameters pattern.
