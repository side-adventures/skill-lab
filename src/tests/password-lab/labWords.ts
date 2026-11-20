// The lab's own copy of the word lists as they were when the lab started (2026-11-20). Password Memory's lists were
// later swapped for better-known words; the lab keeps these until a new lab version, so all its answers stay
// comparable.

/** 4–5 letters. */
export const SHORT_WORDS: string[] = [
  "angel", "angry", "ankle", "apple", "arrow", "attic", "award", "baby", "bacon", "badge", "band", "bank",
  "barn", "beach", "bear", "beard", "bell", "belt", "bench", "berry", "bird", "boat", "bone", "book",
  "boot", "bowl", "brain", "brave", "bread", "brick", "broom", "cabin", "cable", "cake", "camel", "camp",
  "candy", "canoe", "card", "cave", "chain", "chair", "chalk", "chess", "child", "chin", "city", "clock",
  "cloud", "clown", "coast", "coat", "coin", "cold", "comet", "coral", "corn", "couch", "crab", "crown",
  "curly", "daisy", "dark", "desk", "doll", "door", "dream", "dress", "drum", "duck", "dust", "eagle",
  "earth", "elbow", "face", "fairy", "farm", "fast", "fence", "ferry", "field", "fire", "fish", "flag",
  "flame", "flute", "fork", "fresh", "frog", "fruit", "funny", "gate", "ghost", "giant", "gift", "glass",
  "glove", "goat", "gold", "goose", "grape", "grass", "green", "hair", "hand", "happy", "hawk", "heart",
  "hill", "hippo", "hive", "honey", "hook", "horn", "horse", "hotel", "house", "jeans", "jelly", "jewel",
  "king", "kite", "knee", "knife", "lake", "lamp", "leaf", "lemon", "lion", "lock", "lucky", "magic",
  "mask", "medal", "melon", "metal", "milk", "moon", "mouse", "mouth", "nail", "nest", "nose", "ocean",
  "onion", "paint", "panda", "paper", "pasta", "peach", "pear", "pearl", "piano", "pilot", "pine", "pizza",
  "plate", "plum", "poem", "pond", "queen", "quiet", "radio", "raft", "rain", "raven", "rice", "ring",
  "river", "road", "robot", "rock", "roof", "room", "rope", "rose", "round", "royal", "ruby", "rusty",
  "sail", "salad", "salt", "sand", "scarf", "scary", "seal", "shark", "sharp", "sheep", "shell", "shiny",
  "ship", "shirt", "shoe", "skate", "skirt", "sled", "small", "snail", "snake", "snow", "soap", "sock",
  "sofa", "soft", "soup", "spicy", "spoon", "stage", "stamp", "star", "steam", "stone", "storm", "stove",
  "straw", "sugar", "sunny", "swan", "sweet", "sword", "table", "tail", "tent", "tiger", "toast", "tooth",
  "torch", "tower", "train", "tree", "truck", "tulip", "vase", "vest", "wagon", "wand", "warm", "watch",
  "water", "wave", "whale", "wheat", "wheel", "wild", "windy", "wing", "wire", "wise", "wolf", "wood",
  "wool", "worm", "yacht", "zebra",
]

/** 6 letters. */
export const MEDIUM_WORDS: string[] = [
  "almond", "anchor", "animal", "artist", "autumn", "badger", "bakery", "ballet", "bamboo", "banana", "barrel", "basket",
  "beacon", "beaver", "beetle", "blouse", "bonnet", "border", "bottle", "branch", "breeze", "bridge", "bronze", "brunch",
  "bubble", "bucket", "buckle", "bullet", "bundle", "burger", "butter", "button", "cactus", "camera", "candle", "cannon",
  "canyon", "carpet", "carrot", "carton", "castle", "cattle", "cellar", "cheese", "cherry", "church", "circle", "circus",
  "clinic", "closet", "clover", "cobalt", "cobweb", "coffee", "collar", "cookie", "copper", "cotton", "cousin", "cowboy",
  "coyote", "cradle", "crater", "crayon", "cruise", "dancer", "desert", "dinner", "domino", "donkey", "doodle", "dragon",
  "drawer", "empire", "engine", "eraser", "fabric", "falcon", "fiddle", "finger", "flight", "flower", "folder", "forest",
  "fossil", "fridge", "frozen", "gadget", "galaxy", "gallon", "garage", "garden", "garlic", "ginger", "glider", "goblet",
  "goblin", "gravel", "guitar", "hammer", "hanger", "heater", "helmet", "hiccup", "hockey", "hollow", "icicle", "iguana",
  "insect", "island", "jacket", "jaguar", "jersey", "jester", "jigsaw", "jockey", "jungle", "karate", "kennel", "kettle",
  "kidney", "kitten", "knight", "ladder", "lagoon", "lentil", "liquid", "lizard", "locket", "lumber", "magnet", "magpie",
  "mammal", "marble", "market", "meadow", "melody", "meteor", "mirror", "mitten", "monkey", "muffin", "muscle", "museum",
  "napkin", "needle", "nickel", "noodle", "nutmeg", "orange", "oyster", "paddle", "palace", "parade", "parcel", "parrot",
  "pastry", "peanut", "pebble", "pencil", "pepper", "pickle", "pigeon", "pillow", "pirate", "planet", "pocket", "pollen",
  "poodle", "portal", "poster", "potato", "powder", "prince", "puddle", "puffin", "puppet", "puzzle", "quartz", "rabbit",
  "racket", "radish", "raisin", "rattle", "recipe", "rescue", "ribbon", "ripple", "rocket", "rubber", "saddle", "safari",
  "salmon", "sandal", "saucer", "shadow", "shield", "shovel", "shower", "silver", "singer", "sister", "sketch", "sleigh",
  "slogan", "spider", "sponge", "squash", "stable", "staple", "statue", "stereo", "stitch", "stripe", "studio", "sunset",
  "tablet", "tailor", "teapot", "temple", "tennis", "throne", "ticket", "timber", "tiptoe", "toffee", "tomato", "tongue",
  "trophy", "tundra", "tunnel", "turkey", "turnip", "turtle", "tuxedo", "twelve", "valley", "velvet", "vessel", "violet",
  "violin", "voyage", "waffle", "wallet", "walnut", "walrus", "weasel", "willow", "window", "wizard", "wombat", "wrench",
  "yellow", "yogurt", "zigzag", "zipper",
]

/** 7–9 letters. */
export const LONG_WORDS: string[] = [
  "acrobat", "airport", "alphabet", "ambulance", "antelope", "apricot", "aquarium", "armchair", "asteroid", "athlete", "avocado", "backpack",
  "bagpipe", "balloon", "ballroom", "baseball", "bathroom", "bathtub", "battery", "bedroom", "beehive", "bicycle", "biscuit", "blanket",
  "blizzard", "blossom", "blueberry", "bookcase", "boulder", "bracelet", "broccoli", "brother", "buffalo", "building", "bulldozer", "butterfly",
  "cabbage", "calendar", "campfire", "captain", "cardigan", "carnival", "carousel", "cartoon", "cathedral", "cauldron", "ceiling", "champion",
  "chestnut", "chicken", "chimney", "chipmunk", "chocolate", "cinnamon", "clarinet", "classroom", "coconut", "compass", "computer", "costume",
  "cottage", "cricket", "crocodile", "crossword", "crystal", "cupboard", "cupcake", "curtain", "cushion", "daffodil", "daylight", "dentist",
  "diamond", "dinosaur", "dolphin", "doorbell", "doughnut", "dragonfly", "drumstick", "dumpling", "eggplant", "elephant", "elevator", "emerald",
  "engineer", "envelope", "eyebrow", "factory", "farmhouse", "feather", "festival", "firework", "flamingo", "football", "footprint", "forehead",
  "fortress", "fountain", "freezer", "gardener", "gazelle", "giraffe", "glacier", "goldfish", "gondola", "gorilla", "hairbrush", "haircut",
  "hallway", "hamburger", "hammock", "handbag", "harmonica", "harvest", "haystack", "headband", "hedgehog", "highway", "hilltop", "horizon",
  "hospital", "hurricane", "iceberg", "jasmine", "jellyfish", "jukebox", "kangaroo", "keyboard", "kitchen", "lantern", "lavender", "lemonade",
  "leopard", "library", "lobster", "lollipop", "luggage", "magician", "magnolia", "mailbox", "marathon", "meatball", "mechanic", "mermaid",
  "midnight", "milkshake", "moonlight", "mosquito", "motorbike", "mountain", "mushroom", "musician", "mustard", "necklace", "notebook", "oatmeal",
  "octopus", "orchard", "ostrich", "painter", "pancake", "panther", "parachute", "parsley", "passport", "peacock", "pelican", "penguin",
  "pianist", "picture", "pineapple", "pitcher", "platypus", "plumber", "popcorn", "porridge", "postcard", "printer", "pumpkin", "pyramid",
  "raccoon", "railroad", "rainbow", "raincoat", "raindrop", "reindeer", "rhubarb", "rooftop", "rosemary", "sailboat", "sandwich", "sapphire",
  "sardine", "satellite", "saxophone", "scarecrow", "scissors", "scooter", "seashell", "seaweed", "sheriff", "shipwreck", "shoelace", "skeleton",
  "skylight", "slipper", "snowball", "snowflake", "snowman", "spaghetti", "sparrow", "spinach", "squirrel", "stadium", "starfish", "submarine",
  "suitcase", "sunflower", "sunlight", "sunshine", "surgeon", "sweater", "swimmer", "tadpole", "tangerine", "teaspoon", "telescope", "thistle",
  "thunder", "toaster", "tornado", "tortoise", "tractor", "treasure", "trolley", "trumpet", "tugboat", "turquoise", "umbrella", "unicorn",
  "vanilla", "village", "vinegar", "violinist", "volcano", "vulture", "wardrobe", "warrior", "waterfall", "weekend", "whirlpool", "whistle",
  "windmill", "wishbone", "workshop", "wrestler",
]

/** 3 letters (extra group, 128 words): for combining words. */
export const TINY_WORDS: string[] = [
  "ace", "ant", "ape", "arc", "arm", "art", "axe", "bag", "bat", "bay", "bed", "bee",
  "bib", "big", "bow", "box", "bug", "bun", "bus", "cab", "cap", "car", "cat", "cot",
  "cow", "cub", "cup", "day", "den", "dew", "dog", "dot", "dry", "ear", "eel", "egg",
  "elk", "elm", "eye", "fan", "fig", "fin", "fit", "fog", "fox", "fun", "gas", "gem",
  "gum", "gym", "ham", "hat", "hay", "hen", "hip", "hot", "hut", "ice", "icy", "ink",
  "inn", "ivy", "jam", "jar", "jaw", "jet", "joy", "jug", "key", "kid", "kit", "leg",
  "lid", "lip", "log", "map", "mat", "mud", "mug", "net", "new", "nut", "oak", "oar",
  "oat", "odd", "oil", "old", "owl", "pan", "pea", "pen", "pie", "pig", "pin", "pot",
  "pup", "ram", "raw", "red", "rib", "rod", "rug", "sad", "saw", "sea", "shy", "sky",
  "spa", "sum", "sun", "tag", "tan", "tap", "tar", "tea", "tie", "tin", "tip", "toe",
  "top", "toy", "tub", "van", "wax", "web", "wet", "zoo",
]

/** 10–12 letters (extra group, 64 words): one long word at higher levels. */
export const XLONG_WORDS: string[] = [
  "astronomer", "basketball", "blackberry", "blackboard", "butterscotch", "candlestick", "caterpillar", "cauliflower", "cheesecake", "chimpanzee", "clothesline", "countryside",
  "dishwasher", "earthquake", "electrician", "fingernail", "firecracker", "firefighter", "flashlight", "gingerbread", "grapefruit", "grasshopper", "greenhouse", "hairdresser",
  "helicopter", "hippopotamus", "honeysuckle", "hummingbird", "kingfisher", "lighthouse", "marshmallow", "microscope", "motorcycle", "nightingale", "paintbrush", "peppermint",
  "photograph", "pillowcase", "playground", "pomegranate", "rainforest", "refrigerator", "salamander", "sandcastle", "scoreboard", "skateboard", "skyscraper", "snowmobile",
  "strawberry", "tablecloth", "tablespoon", "tambourine", "thunderstorm", "toothbrush", "toothpaste", "trampoline", "typewriter", "volleyball", "watermelon", "wheelbarrow",
  "wheelchair", "windowsill", "woodpecker", "wristwatch",
]
