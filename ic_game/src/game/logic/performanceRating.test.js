import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_STARS,
  MIN_STARS,
  RatingTier,
  calculateStarRating,
  calculateAccuracyPercent,
} from "./performanceRating.js";

test("calculateStarRating: 0 mistakes yields 3 stars and isPerfect = true", () => {
  const result = calculateStarRating({ mistakes: 0 });
  assert.equal(result.stars, 3);
  assert.equal(result.maxStars, MAX_STARS);
  assert.equal(result.mistakes, 0);
  assert.equal(result.isPerfect, true);
  assert.equal(result.tier, RatingTier.PERFECT);
});

test("calculateStarRating: 1 or 2 mistakes yields 2 stars and isPerfect = false", () => {
  const oneMistake = calculateStarRating({ mistakes: 1 });
  assert.equal(oneMistake.stars, 2);
  assert.equal(oneMistake.isPerfect, false);
  assert.equal(oneMistake.tier, RatingTier.GOOD);

  const twoMistakes = calculateStarRating({ mistakes: 2 });
  assert.equal(twoMistakes.stars, 2);
  assert.equal(twoMistakes.isPerfect, false);
  assert.equal(twoMistakes.tier, RatingTier.GOOD);
});

test("calculateStarRating: 3 or more mistakes yields minimum 1 star", () => {
  const threeMistakes = calculateStarRating({ mistakes: 3 });
  assert.equal(threeMistakes.stars, MIN_STARS);
  assert.equal(threeMistakes.isPerfect, false);
  assert.equal(threeMistakes.tier, RatingTier.COMPLETED);

  const manyMistakes = calculateStarRating({ mistakes: 15 });
  assert.equal(manyMistakes.stars, 1);
  assert.equal(manyMistakes.mistakes, 15);
});

test("calculateStarRating: sanitizes negative or invalid inputs to 0 mistakes", () => {
  const negative = calculateStarRating({ mistakes: -5 });
  assert.equal(negative.stars, 3);
  assert.equal(negative.mistakes, 0);
  assert.equal(negative.isPerfect, true);

  const emptyCall = calculateStarRating();
  assert.equal(emptyCall.stars, 3);
});

test("calculateAccuracyPercent: computes percentage of correct challenges over total attempts", () => {
  assert.equal(
    calculateAccuracyPercent({ totalChallenges: 10, mistakes: 0 }),
    100,
  );
  assert.equal(
    calculateAccuracyPercent({ totalChallenges: 10, mistakes: 10 }),
    50,
  );
  assert.equal(
    calculateAccuracyPercent({ totalChallenges: 8, mistakes: 2 }),
    80,
  );
});
