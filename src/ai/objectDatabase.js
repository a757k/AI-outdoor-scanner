const BIG_OBJECTS = new Set([
  "person",
  "car",
  "truck",
  "bus",
  "train",
  "motorcycle",
  "bicycle",
  "horse",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe"
]);

const MEDIUM_OBJECTS = new Set([
  "bird",
  "cat",
  "dog",
  "sheep",
  "goat",
  "rabbit",
  "lizard",
  "chicken"
]);

const SMALL_OBJECTS = new Set([
  "mouse"
]);

export function getModeForObject(
  objectName
) {
  const name =
    objectName.toLowerCase();

  if (BIG_OBJECTS.has(name)) {
    return "BIG";
  }

  if (MEDIUM_OBJECTS.has(name)) {
    return "MEDIUM";
  }

  if (SMALL_OBJECTS.has(name)) {
    return "SMALL";
  }

  return "MEDIUM";
}

export function isObjectAllowed(
  objectName,
  selectedMode
) {
  const objectMode =
    getModeForObject(objectName);

  return (
    objectMode === selectedMode
  );
}

export function getDisplayName(
  objectName
) {
  const specialNames = {
    person: "HUMAN",
    motorcycle: "MOTORCYCLE",
    bicycle: "BICYCLE",
    bird: "BIRD",
    dog: "DOG",
    cat: "CAT",
    horse: "HORSE",
    cow: "COW",
    bear: "BEAR",
    elephant: "ELEPHANT",
    mouse: "RODENT"
  };

  return (
    specialNames[objectName] ||
    objectName.toUpperCase()
  );
}

export function getThreatLevel(
  objectName
) {
  const high = new Set([
    "bear",
    "elephant"
  ]);

  const moderate = new Set([
    "person",
    "horse",
    "cow",
    "dog"
  ]);

  if (high.has(objectName)) {
    return "high";
  }

  if (moderate.has(objectName)) {
    return "moderate";
  }

  return "normal";
}
