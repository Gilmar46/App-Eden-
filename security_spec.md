# Security Specification - Igreja Conectada

## Data Invariants
1. A comment must belong to an existing content ID.
2. A leader can only manage content and scales within their department.
3. Members can only read data and create/delete their own comments/prayers.
4. Admins have override access to all corrections.
5. All IDs must be strictly validated.
6. User profiles can only be updated by the owner or an admin.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a comment with someone else's `userId`.
2. **Elevated Privileges**: Attempt to set `userType` to 'admin' when registering as a member.
3. **Ghost Collection**: Attempt to write to `/super_admin_config/secret`.
4. **ID Poisoning**: Attempt to use `../members/admin_uid` as a `contentId` in comments.
5. **PII Leak**: Unauthenticated user attempting to list `/members/` with emails and phones.
6. **Cross-Department Sabotage**: Leader of Department A attempting to delete a scale in Department B.
7. **Resource Exhaustion**: Attempt to send a 1MB string in `comment.text`.
8. **Time Spoofing**: Attempt to set `createdAt` in the past for a new announcement.
9. **Relational Break**: Creating a scale for a non-existent member.
10. **State Skipping**: Attempt to force a scale status to 'confirmed' without being the assigned member.
11. **Negative Count**: Attempt to set `prayerCount` to -100.
12. **Immutable Field Attack**: Attempt to change `authorId` on an existing devotional.

## Test Suite Plan
- Verify that only authenticated users can read sensitive data.
- Verify that `isLider()` correctly checks `departmentId`.
- Verify that `isAdmin()` handles the hardcoded email and the DB role.
- Verify that `isValidComment()` rejects shadow fields.
