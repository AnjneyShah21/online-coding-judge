const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'judge.db');
const db = new Database(dbPath);

console.log("Connected to", dbPath);

// Ensure column target_languages exists
try {
  db.prepare("ALTER TABLE problems ADD COLUMN target_languages TEXT DEFAULT '[]'").run();
} catch (e) {
  // column already exists
}

// Get admin ID
let admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
const adminId = admin ? admin.id : 'system-admin';

// Remove old problems and test cases to clean up generic duplicates
db.pragma("foreign_keys = OFF");
db.prepare("DELETE FROM submission_results").run();
db.prepare("DELETE FROM test_cases").run();
db.prepare("DELETE FROM submissions").run();
db.prepare("DELETE FROM contest_problems").run();
db.prepare("DELETE FROM bookmarks").run();
db.prepare("DELETE FROM problems").run();
db.pragma("foreign_keys = ON");

console.log("Cleared old problems. Seeding language-specific problems...");

const problems = [
  // ─── C++ DEDICATED PROBLEMS ──────────────────────────────────────────────
  {
    title: "C++ STL: Top-K Frequent Elements with Priority Queue",
    slug: "cpp-top-k-frequent-elements",
    difficulty: "medium",
    time_limit_ms: 1500,
    memory_limit_mb: 256,
    tags: ["cpp", "stl", "priority-queue", "hash-map"],
    target_languages: ["cpp"],
    description: `# C++ Track: Top-K Frequent Elements

Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements in descending order of frequency. If frequencies are equal, break ties in ascending order of the number.

This challenge evaluates proficiency with **C++ STL containers** (\`std::unordered_map\`, \`std::priority_queue\`, and custom lambda/struct comparators).

### Input Format
- First line: integer \`n\` (number of elements)
- Second line: \`n\` space-separated integers
- Third line: integer \`k\`

### Output Format
- Space-separated integers representing the \`k\` most frequent elements.

### Constraints
- \`1 <= k <= n <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\``,
    starter_code: {
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
#include <queue>
#include <algorithm>

using namespace std;

struct Comp {
    bool operator()(const pair<int, int>& a, const pair<int, int>& b) {
        if (a.second != b.second) return a.second < b.second; // Max-heap by frequency
        return a.first > b.first; // Tie-break: smaller element first
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;
    unordered_map<int, int> freq;
    for (int i = 0; i < n; i++) {
        int x; cin >> x;
        freq[x]++;
    }
    int k;
    cin >> k;

    priority_queue<pair<int, int>, vector<pair<int, int>>, Comp> pq;
    for (auto& p : freq) {
        pq.push(p);
    }

    vector<int> res;
    for (int i = 0; i < k && !pq.empty(); i++) {
        res.push_back(pq.top().first);
        pq.pop();
    }

    for (size_t i = 0; i < res.size(); i++) {
        cout << res[i] << (i + 1 == res.size() ? "" : " ");
    }
    cout << "\\n";
    return 0;
}
`
    },
    test_cases: [
      { input: "6\n1 1 1 2 2 3\n2", expected_output: "1 2", is_sample: 1 },
      { input: "1\n1\n1", expected_output: "1", is_sample: 1 },
      { input: "8\n4 4 4 2 2 1 1 3\n2", expected_output: "4 1", is_sample: 0 },
      { input: "5\n10 20 10 30 20\n2", expected_output: "10 20", is_sample: 0 },
    ]
  },
  {
    title: "C++ Memory & Bitwise: Prefix XOR Range Inversion",
    slug: "cpp-prefix-xor-range",
    difficulty: "easy",
    time_limit_ms: 1000,
    memory_limit_mb: 128,
    tags: ["cpp", "bitwise", "prefix-xor", "fast-io"],
    target_languages: ["cpp"],
    description: `# C++ Track: Prefix XOR Range Evaluation

Given an array of \`n\` integers, compute the total cumulative XOR sum of all elements: \`A[0] ^ A[1] ^ ... ^ A[n-1]\`, followed by evaluating whether the cumulative XOR is an even or odd parity number.

### Input Format
- First line: integer \`n\`
- Second line: \`n\` space-separated integers

### Output Format
- Print two space-separated values: the cumulative XOR value, and \`EVEN\` or \`ODD\` based on the value's parity.

### Constraints
- \`1 <= n <= 10^5\`
- \`0 <= A[i] <= 10^9\``,
    starter_code: {
      cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;
    long long totalXor = 0;
    for (int i = 0; i < n; i++) {
        long long val; cin >> val;
        totalXor ^= val;
    }

    cout << totalXor << " " << (totalXor % 2 == 0 ? "EVEN" : "ODD") << "\\n";
    return 0;
}
`
    },
    test_cases: [
      { input: "4\n1 2 3 4", expected_output: "4 EVEN", is_sample: 1 },
      { input: "3\n5 5 7", expected_output: "7 ODD", is_sample: 1 },
      { input: "5\n10 20 30 40 50", expected_output: "28 EVEN", is_sample: 0 },
      { input: "1\n0", expected_output: "0 EVEN", is_sample: 0 },
    ]
  },

  // ─── JAVA DEDICATED PROBLEMS ─────────────────────────────────────────────
  {
    title: "Java Collections: Group Anagrams with HashMap",
    slug: "java-group-anagrams-hashmap",
    difficulty: "medium",
    time_limit_ms: 2500,
    memory_limit_mb: 256,
    tags: ["java", "collections", "hashmap", "string"],
    target_languages: ["java"],
    description: `# Java Track: Group Anagrams with HashMap

Given an array of strings \`strs\`, group the anagrams together. Return the number of unique anagram groups, followed on the next line by the size of the largest group.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

### Input Format
- First line: integer \`n\` (number of strings)
- Second line: \`n\` space-separated lowercase strings

### Output Format
- Print two space-separated integers: \`<total_groups> <max_group_size>\`

### Constraints
- \`1 <= n <= 10^4\`
- \`1 <= strs[i].length <= 100\``,
    starter_code: {
      java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        Map<String, Integer> groups = new HashMap<>();

        for (int i = 0; i < n; i++) {
            String word = sc.next();
            char[] chars = word.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            groups.put(key, groups.getOrDefault(key, 0) + 1);
        }

        int maxGroup = 0;
        for (int size : groups.values()) {
            if (size > maxGroup) maxGroup = size;
        }

        System.out.println(groups.size() + " " + maxGroup);
    }
}
`
    },
    test_cases: [
      { input: "6\neat tea tan ate nat bat", expected_output: "3 3", is_sample: 1 },
      { input: "1\na", expected_output: "1 1", is_sample: 1 },
      { input: "4\nstop pots tops spot", expected_output: "1 4", is_sample: 0 },
      { input: "5\na b c d e", expected_output: "5 1", is_sample: 0 },
    ]
  },
  {
    title: "Java OOP & Streams: Valid Palindrome String Filter",
    slug: "java-palindrome-string-stream",
    difficulty: "easy",
    time_limit_ms: 2000,
    memory_limit_mb: 256,
    tags: ["java", "strings", "two-pointers"],
    target_languages: ["java"],
    description: `# Java Track: Valid Alphanumeric Palindrome Filter

A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Determine if the provided phrase is a valid palindrome.

### Input Format
- A single line containing string \`s\`

### Output Format
- Print \`true\` or \`false\`

### Constraints
- \`1 <= s.length <= 2 * 10^5\``,
    starter_code: {
      java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String s = reader.readLine();
        if (s == null) {
            System.out.println("true");
            return;
        }

        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                sb.append(Character.toLowerCase(c));
            }
        }

        String cleaned = sb.toString();
        String reversed = sb.reverse().toString();
        System.out.println(cleaned.equals(reversed) ? "true" : "false");
    }
}
`
    },
    test_cases: [
      { input: "A man, a plan, a canal: Panama", expected_output: "true", is_sample: 1 },
      { input: "race a car", expected_output: "false", is_sample: 1 },
      { input: "Was it a car or a cat I saw?", expected_output: "true", is_sample: 0 },
      { input: "hello world", expected_output: "false", is_sample: 0 },
    ]
  },

  // ─── PYTHON DEDICATED PROBLEMS ───────────────────────────────────────────
  {
    title: "Pythonic Logic: Subarray Sum Divisible by K",
    slug: "python-subarray-sum-divisible-k",
    difficulty: "medium",
    time_limit_ms: 2000,
    memory_limit_mb: 256,
    tags: ["python", "hash-map", "math", "prefix-sums"],
    target_languages: ["python"],
    description: `# Python Track: Subarray Sum Divisible by K

Given an integer list \`nums\` and an integer \`k\`, return the number of non-empty subarrays that have a sum divisible by \`k\`.

A subarray is a contiguous part of an array.

This problem highlights idiomatic **Python dictionary lookups**, prefix sum remainder arithmetic, and O(N) complexity.

### Input Format
- First line: \`n\` and \`k\` separated by space
- Second line: \`n\` space-separated integers

### Output Format
- A single integer representing the count of valid subarrays.

### Constraints
- \`1 <= nums.length <= 3 * 10^4\`
- \`-10^4 <= nums[i] <= 10^4\`
- \`2 <= k <= 10^4\``,
    starter_code: {
      python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    k = int(input_data[1])
    nums = [int(x) for x in input_data[2:2+n]]

    remainder_count = {0: 1}
    prefix_sum = 0
    ans = 0

    for x in nums:
        prefix_sum += x
        rem = prefix_sum % k
        if rem in remainder_count:
            ans += remainder_count[rem]
            remainder_count[rem] += 1
        else:
            remainder_count[rem] = 1

    print(ans)

solve()
`
    },
    test_cases: [
      { input: "6 5\n4 5 0 -2 -3 1", expected_output: "7", is_sample: 1 },
      { input: "1 5\n5", expected_output: "1", is_sample: 1 },
      { input: "4 3\n1 2 3 4", expected_output: "4", is_sample: 0 },
      { input: "5 7\n7 7 7 7 7", expected_output: "15", is_sample: 0 },
    ]
  },
  {
    title: "Python Matrix: Coordinate Spiral Order Traversal",
    slug: "python-matrix-spiral-order",
    difficulty: "medium",
    time_limit_ms: 1500,
    memory_limit_mb: 128,
    tags: ["python", "matrix", "simulation"],
    target_languages: ["python"],
    description: `# Python Track: Matrix Spiral Traversal

Given an \`m x n\` matrix, return all elements of the matrix in spiral order (clockwise starting from top-left \`[0, 0]\`).

### Input Format
- First line: \`m\` and \`n\`
- Next \`m\` lines: \`n\` space-separated integers

### Output Format
- Space-separated integers representing the spiral path.

### Constraints
- \`1 <= m, n <= 100\``,
    starter_code: {
      python: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    m, n = int(data[0]), int(data[1])
    matrix = []
    idx = 2
    for _ in range(m):
        matrix.append([int(x) for x in data[idx:idx+n]])
        idx += n

    res = []
    top, bottom, left, right = 0, m - 1, 0, n - 1

    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            res.append(matrix[top][c])
        top += 1

        for r in range(top, bottom + 1):
            res.append(matrix[r][right])
        right -= 1

        if top <= bottom:
            for c in range(right, left - 1, -1):
                res.append(matrix[bottom][c])
            bottom -= 1

        if left <= right:
            for r in range(bottom, top - 1, -1):
                res.append(matrix[r][left])
            left += 1

    print(" ".join(map(str, res)))

solve()
`
    },
    test_cases: [
      { input: "3 3\n1 2 3\n4 5 6\n7 8 9", expected_output: "1 2 3 6 9 8 7 4 5", is_sample: 1 },
      { input: "1 4\n1 2 3 4", expected_output: "1 2 3 4", is_sample: 1 },
      { input: "3 1\n10\n20\n30", expected_output: "10 20 30", is_sample: 0 },
      { input: "2 2\n1 2\n3 4", expected_output: "1 2 4 3", is_sample: 0 },
    ]
  },

  // ─── JAVASCRIPT DEDICATED PROBLEMS ───────────────────────────────────────
  {
    title: "JavaScript ES6: Deep Object Flattener & Key Paths",
    slug: "js-deep-object-flattener",
    difficulty: "medium",
    time_limit_ms: 1500,
    memory_limit_mb: 256,
    tags: ["javascript", "es6", "json", "recursion"],
    target_languages: ["javascript"],
    description: `# JavaScript Track: JSON Key Path Count & Depth

Given a serialized JSON object, parse the object and compute:
1. The total number of primitive leaf values (strings, numbers, booleans)
2. The maximum nesting depth of the object.

This challenge tests **JavaScript JSON manipulation**, recursive tree exploration, and ES6 \`Object.entries\` traversal.

### Input Format
- A single line containing a valid JSON object string.

### Output Format
- Print two space-separated integers: \`<leaf_count> <max_depth>\`

### Constraints
- Valid JSON object syntax. Max length \`5000\` characters.`,
    starter_code: {
      javascript: `const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;

    try {
        const obj = JSON.parse(input);
        let leafCount = 0;
        let maxDepth = 0;

        function traverse(curr, depth) {
            if (depth > maxDepth) maxDepth = depth;
            if (curr !== null && typeof curr === 'object') {
                const keys = Object.keys(curr);
                if (keys.length === 0) {
                    leafCount++;
                } else {
                    for (const k of keys) {
                        traverse(curr[k], depth + 1);
                    }
                }
            } else {
                leafCount++;
            }
        }

        traverse(obj, 1);
        console.log(leafCount + " " + maxDepth);
    } catch (e) {
        console.log("0 0");
    }
}

main();
`
    },
    test_cases: [
      { input: '{"a": 1, "b": {"c": 2, "d": 3}}', expected_output: "3 3", is_sample: 1 },
      { input: '{"user": {"profile": {"name": "Alex"}}}', expected_output: "1 4", is_sample: 1 },
      { input: '{"x": 10, "y": 20}', expected_output: "2 2", is_sample: 0 },
      { input: '{"a": {"b": {"c": {"d": 42}}}}', expected_output: "1 5", is_sample: 0 },
    ]
  },
  {
    title: "JavaScript: Longest Substring Without Repeating Characters",
    slug: "js-longest-unique-substring",
    difficulty: "medium",
    time_limit_ms: 1500,
    memory_limit_mb: 256,
    tags: ["javascript", "set", "sliding-window"],
    target_languages: ["javascript"],
    description: `# JavaScript Track: Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the longest substring without repeating characters using the **Sliding Window pattern** and JavaScript \`Set\`.

### Input Format
- A single line containing string \`s\`

### Output Format
- An integer representing the length of the longest unique substring.

### Constraints
- \`0 <= s.length <= 5 * 10^4\``,
    starter_code: {
      javascript: `const fs = require('fs');

function main() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    if (!s) {
        console.log(0);
        return;
    }

    let maxLen = 0;
    let left = 0;
    const seen = new Set();

    for (let right = 0; right < s.length; right++) {
        while (seen.has(s[right])) {
            seen.delete(s[left]);
            left++;
        }
        seen.add(s[right]);
        maxLen = Math.max(maxLen, right - left + 1);
    }

    console.log(maxLen);
}

main();
`
    },
    test_cases: [
      { input: "abcabcbb", expected_output: "3", is_sample: 1 },
      { input: "bbbbb", expected_output: "1", is_sample: 1 },
      { input: "pwwkew", expected_output: "3", is_sample: 0 },
      { input: "abcdef", expected_output: "6", is_sample: 0 },
    ]
  }
];

// Insert each language-specific problem
for (const p of problems) {
  const probId = uuidv4();
  db.prepare(`
    INSERT INTO problems (id, title, slug, description, difficulty, time_limit_ms, memory_limit_mb, tags, starter_code, target_languages, is_published, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    probId,
    p.title,
    p.slug,
    p.description,
    p.difficulty,
    p.time_limit_ms,
    p.memory_limit_mb,
    JSON.stringify(p.tags),
    JSON.stringify(p.starter_code),
    JSON.stringify(p.target_languages),
    adminId
  );

  p.test_cases.forEach((tc, idx) => {
    db.prepare(`
      INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      probId,
      tc.input,
      tc.expected_output,
      tc.is_sample,
      idx
    );
  });

  console.log(`Inserted [${p.target_languages.join(',')}] -> ${p.title} (${p.test_cases.length} test cases)`);
}

console.log("Seeding complete! Distinct questions created for C++, Java, Python, and JavaScript.");
