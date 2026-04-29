/**
 * Escape special characters for safe use in RegExp constructor.
 * Prevents regex injection from user-provided input.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Validate a string is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));

module.exports = { escapeRegex, isValidObjectId };
