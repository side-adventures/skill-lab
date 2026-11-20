// Words for Password Memory: words a learner of English knows (about school level), so a player can still see the
// word behind the changes. Varied in meaning (animals, food, places, people, things, activities, well-known names) and
// in shape (endings, double letters, first letters); several are common in real password lists (dragon, sunshine,
// football). All spelled the same in US and UK English (checked against both system dictionaries; names in their
// capitalized form). 256 words per main group (4–5, 6, 7–9 letters), so each is worth 8 bits whatever its length;
// the extra groups (3 and 10–12 letters) are smaller, because there are fewer good words of those lengths.

/** 4–5 letters. */
export const SHORT_WORDS: string[] = [
  "alien", "angel", "anna", "apple", "baby", "bacon", "ball", "beach", "bear", "bell", "belt", "berry",
  "bike", "bird", "black", "blue", "boat", "book", "boot", "bowl", "brain", "brave", "bread", "brick",
  "brown", "bunny", "cairo", "cake", "camel", "camp", "candy", "card", "chair", "chef", "chess", "child",
  "china", "city", "clock", "cloud", "clown", "coat", "coin", "cold", "corn", "crab", "crazy", "cream",
  "crown", "cuba", "dance", "dark", "david", "deer", "desk", "doll", "door", "dream", "dress", "drum",
  "dubai", "duck", "eagle", "earth", "egypt", "emma", "face", "farm", "fast", "field", "film", "fire",
  "fish", "flag", "flame", "fork", "fresh", "frog", "fruit", "funny", "game", "ghost", "giant", "gift",
  "girl", "glass", "glove", "goal", "goat", "gold", "golf", "grape", "grass", "green", "hair", "hand",
  "happy", "heart", "hello", "hero", "hill", "hippo", "home", "honey", "horse", "hotel", "house", "india",
  "italy", "japan", "jeans", "joke", "juice", "king", "kite", "knife", "koala", "lake", "lamb", "lamp",
  "laser", "leaf", "lemon", "light", "lion", "lock", "love", "lucky", "lunch", "magic", "mango", "maria",
  "mars", "mask", "melon", "metal", "miami", "milk", "money", "moon", "mouse", "mouth", "movie", "music",
  "nest", "night", "ninja", "nose", "nurse", "ocean", "olive", "onion", "paint", "panda", "paper", "paris",
  "park", "party", "pasta", "peace", "peach", "pear", "peru", "phone", "photo", "piano", "pilot", "pink",
  "pizza", "plant", "plate", "pluto", "pony", "power", "puppy", "queen", "quiet", "radio", "rain", "rice",
  "ring", "river", "robot", "rock", "rome", "roof", "rope", "rose", "royal", "salad", "salt", "sand",
  "seal", "seven", "shark", "sheep", "shiny", "shirt", "shoe", "shop", "small", "smile", "snack", "snake",
  "snow", "sock", "sofa", "song", "soup", "space", "spain", "spoon", "sport", "star", "stone", "storm",
  "story", "sugar", "sunny", "super", "sushi", "sweet", "sword", "table", "taco", "team", "tent", "three",
  "tiger", "time", "toast", "tokyo", "tooth", "towel", "tower", "town", "train", "tree", "truck", "venus",
  "video", "watch", "wave", "whale", "wheel", "white", "wild", "wind", "wise", "witch", "wolf", "wood",
  "yoga", "zebra", "zero", "zeus",
]

/** 6 letters. */
export const MEDIUM_WORDS: string[] = [
  "action", "alaska", "anchor", "animal", "apollo", "artist", "athena", "atomic", "author", "autumn", "bakery", "ballet",
  "bamboo", "banana", "basket", "beetle", "berlin", "bikini", "bottle", "boxing", "brazil", "breeze", "bridge", "bright",
  "bronze", "bubble", "bucket", "burger", "butter", "button", "cactus", "camera", "canada", "candle", "canyon", "carbon",
  "carpet", "carrot", "casino", "castle", "celery", "cereal", "cheese", "cherry", "church", "cinema", "circle", "circus",
  "clever", "cloudy", "coffee", "cookie", "corner", "cosmic", "cotton", "cousin", "cowboy", "cruise", "dancer", "danger",
  "daniel", "darwin", "desert", "dinner", "doctor", "domino", "donkey", "dragon", "driver", "dublin", "eleven", "empire",
  "energy", "engine", "eraser", "europe", "falcon", "family", "famous", "farmer", "father", "finger", "flight", "flower",
  "forest", "france", "fridge", "friend", "frozen", "future", "galaxy", "garage", "garden", "garlic", "gentle", "ginger",
  "golden", "greece", "guitar", "hammer", "hawaii", "helmet", "hockey", "honest", "hungry", "insect", "island", "jacket",
  "jaguar", "jersey", "jungle", "karate", "kettle", "kimono", "kitten", "knight", "ladder", "laptop", "legend", "liquid",
  "little", "lizard", "london", "lovely", "madrid", "magnet", "marble", "market", "master", "matrix", "melody", "memory",
  "meteor", "mexico", "middle", "minute", "mirror", "mobile", "modern", "monkey", "mother", "mozart", "muffin", "muscle",
  "museum", "nature", "needle", "newton", "noodle", "number", "office", "oliver", "orange", "oxygen", "palace", "panama",
  "parade", "parent", "parrot", "pastry", "peanut", "pencil", "people", "pepper", "pickle", "picnic", "pigeon", "pillow",
  "pirate", "planet", "player", "pocket", "police", "poster", "potato", "pretty", "prince", "purple", "puzzle", "rabbit",
  "racing", "remote", "rescue", "rocket", "safari", "sahara", "sailor", "salmon", "saturn", "school", "screen", "season",
  "secret", "shadow", "shield", "silent", "silver", "simple", "singer", "sister", "skiing", "sleepy", "smooth", "soccer",
  "spider", "spirit", "sponge", "spring", "square", "statue", "sticky", "stormy", "street", "strong", "studio", "summer",
  "summit", "sunset", "sydney", "tablet", "tailor", "target", "tattoo", "teapot", "temple", "tennis", "thanks", "thirty",
  "thomas", "throne", "ticket", "toilet", "tomato", "tongue", "travel", "trophy", "tunnel", "turkey", "turtle", "twelve",
  "twenty", "valley", "velvet", "viking", "violet", "violin", "waffle", "wallet", "walnut", "window", "winter", "wizard",
  "wonder", "yellow", "yogurt", "zombie",
]

/** 7–9 letters. */
export const LONG_WORDS: string[] = [
  "adventure", "airport", "amazing", "ambulance", "amsterdam", "argentina", "asteroid", "astronaut", "atlantic", "australia", "avocado", "awesome",
  "backpack", "balcony", "balloon", "barbecue", "barcelona", "baseball", "basement", "bathroom", "battery", "beautiful", "bedroom", "beethoven",
  "bicycle", "birthday", "biscuit", "blanket", "blueberry", "bracelet", "breakfast", "broccoli", "brother", "bulldog", "burrito", "butterfly",
  "calendar", "captain", "cartoon", "champion", "charlie", "cheetah", "chicago", "chicken", "chocolate", "cinnamon", "coconut", "computer",
  "concert", "costume", "country", "crocodile", "crystal", "cucumber", "cupcake", "dancing", "dangerous", "dentist", "detective", "diamond",
  "digital", "dinosaur", "dolphin", "drummer", "earring", "eclipse", "einstein", "electric", "elephant", "elevator", "emerald", "emperor",
  "engineer", "england", "envelope", "espresso", "evening", "everest", "explorer", "factory", "fantastic", "fantasy", "festival", "fireman",
  "fireplace", "firework", "fishing", "flamingo", "florida", "football", "forever", "fountain", "freedom", "friendly", "germany", "giraffe",
  "gladiator", "glasses", "goldfish", "gorilla", "grandma", "hamburger", "hamster", "hedgehog", "hercules", "highway", "history", "holiday",
  "hollywood", "homework", "horizon", "hospital", "husband", "iceberg", "internet", "inventor", "invisible", "ireland", "jamaica", "jellyfish",
  "journey", "jupiter", "kangaroo", "karaoke", "ketchup", "keyboard", "kingdom", "kitchen", "language", "lemonade", "leopard", "library",
  "lightning", "lobster", "lollipop", "magazine", "magical", "magician", "marathon", "meatball", "medicine", "mercury", "mermaid", "message",
  "michael", "midnight", "milkshake", "monitor", "monster", "moonlight", "morning", "mosquito", "motorbike", "mountain", "mushroom", "musician",
  "mystery", "napoleon", "necklace", "neptune", "notebook", "octopus", "ostrich", "pacific", "painter", "painting", "pancake", "panther",
  "paradise", "passport", "peaceful", "peacock", "penguin", "perfect", "picasso", "picture", "pineapple", "plumber", "popcorn", "portugal",
  "postman", "powerful", "president", "princess", "printer", "pumpkin", "pyramid", "question", "rainbow", "referee", "reindeer", "samurai",
  "sandwich", "sausage", "science", "scientist", "scissors", "scooter", "scorpion", "scotland", "sherlock", "shopping", "skeleton", "snowball",
  "snowflake", "snowman", "soldier", "spaceship", "spaghetti", "speaker", "special", "squirrel", "stadium", "staircase", "starfish", "station",
  "student", "submarine", "suitcase", "sunflower", "sunlight", "sunrise", "sunshine", "surprise", "sweater", "swimming", "teacher", "teenager",
  "telescope", "thailand", "thunder", "tomorrow", "tornado", "toronto", "tortilla", "tractor", "treasure", "umbrella", "unicorn", "uniform",
  "universe", "vampire", "vanilla", "victory", "vietnam", "village", "volcano", "warrior", "waterfall", "weather", "website", "weekend",
  "welcome", "william", "wonderful", "yesterday",
]

/** 3 letters (extra group, 128 words): for combining words. */
export const TINY_WORDS: string[] = [
  "air", "ant", "arm", "art", "bag", "bat", "bay", "bed", "bee", "ben", "big", "box",
  "boy", "bug", "bus", "buy", "cap", "car", "cat", "cow", "cry", "cup", "cut", "dad",
  "day", "dig", "dog", "dot", "dry", "ear", "eat", "egg", "eye", "fan", "far", "fig",
  "fit", "fix", "fly", "fog", "fox", "fry", "fun", "gas", "gem", "gym", "ham", "hat",
  "hen", "hit", "hot", "hug", "hut", "ice", "icy", "ink", "jam", "jar", "jet", "job",
  "joy", "key", "kid", "lab", "leg", "leo", "lip", "log", "low", "mad", "man", "map",
  "mat", "max", "mix", "mud", "mug", "nap", "net", "new", "nut", "oak", "oil", "old",
  "one", "owl", "pan", "pen", "pet", "pie", "pig", "pin", "pop", "pot", "rat", "ray",
  "red", "rio", "rug", "run", "sad", "sam", "saw", "sea", "shy", "sit", "six", "ski",
  "sky", "spy", "sun", "tag", "tap", "tea", "ten", "tie", "tip", "toe", "tom", "top",
  "toy", "two", "van", "wax", "web", "wet", "win", "zoo",
]

/** 10–12 letters (extra group, 64 words): one long word at higher levels. */
export const XLONG_WORDS: string[] = [
  "background", "basketball", "blackberry", "calculator", "california", "caterpillar", "cheesecake", "chimpanzee", "cinderella", "countryside", "dictionary", "dishwasher",
  "earthquake", "electrician", "firefighter", "flashlight", "friendship", "gingerbread", "goalkeeper", "grandfather", "grandmother", "grapefruit", "greenhouse", "hairdresser",
  "headphones", "helicopter", "hippopotamus", "lighthouse", "manchester", "marshmallow", "masterpiece", "microphone", "microscope", "motorcycle", "paintbrush", "peppermint",
  "photograph", "photographer", "playground", "rainforest", "refrigerator", "restaurant", "sandcastle", "scoreboard", "screwdriver", "shakespeare", "skateboard", "skyscraper",
  "smartphone", "strawberry", "sunglasses", "supermarket", "television", "thunderstorm", "toothbrush", "toothpaste", "trampoline", "university", "volleyball", "washington",
  "watermelon", "wheelchair", "wonderland", "wristwatch",
]
