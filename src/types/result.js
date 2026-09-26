/**
 * This file has no runtime code — it just documents the exact JSON shape
 * we ask the model for, and that validateResult.js checks against.
 * Designing this shape BEFORE writing the prompt is step 1 of the guide.
 *
 * @typedef {Object} Flashcard
 * @property {string} question
 * @property {string} answer
 *
 * @typedef {Object} StudySet
 * @property {string} topic          - short title, e.g. "Photosynthesis"
 * @property {Flashcard[]} cards     - 5-10 question/answer pairs
 */

export {};
