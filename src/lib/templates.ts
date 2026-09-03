export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  badge: string;
  color: string;
  textColor: string;
  folder: string;
  description: string;
  content: string;
}

export const STARTER_TEMPLATES: TemplateItem[] = [
  {
    id: 'ranges',
    name: 'Modern Ranges',
    category: 'C++20',
    badge: '<ranges>',
    color: '#1E293B',
    textColor: '#F8FAFC',
    folder: 'src/modern_cpp',
    description: 'Declarative pipelines with std::ranges and views',
    content: `#include <iostream>
#include <vector>
#include <ranges>
#include <numeric>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    std::cout << "✨ Modern C++ Ranges Pipeline ✨\\n";
    std::cout << "Original numbers: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << "\\n\\n";

    // Filter even numbers and square them
    auto even_squares = numbers 
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    std::cout << "Even squares: ";
    for (int n : even_squares) {
        std::cout << n << " ";
    }
    std::cout << "\\n";

    return 0;
}
`
  },
  {
    id: 'bst',
    name: 'Binary Search Tree',
    category: 'Data Structures',
    badge: 'BST Node',
    color: '#B6A0E4',
    textColor: '#1E1E1E',
    folder: 'src/data_structures',
    description: 'Pointer-based BST with in-order traversal and search',
    content: `#include <iostream>
#include <memory>

struct Node {
    int value;
    std::unique_ptr<Node> left;
    std::unique_ptr<Node> right;

    explicit Node(int val) : value(val) {}
};

void insert(std::unique_ptr<Node>& root, int val) {
    if (!root) {
        root = std::make_unique<Node>(val);
        return;
    }
    if (val < root->value) {
        insert(root->left, val);
    } else {
        insert(root->right, val);
    }
}

void inOrder(const std::unique_ptr<Node>& root) {
    if (!root) return;
    inOrder(root->left);
    std::cout << root->value << " ";
    inOrder(root->right);
}

int main() {
    std::unique_ptr<Node> root = nullptr;
    int items[] = {50, 30, 70, 20, 40, 60, 80};

    std::cout << "🌲 Binary Search Tree In-Order Traversal:\\n";
    for (int item : items) {
        insert(root, item);
    }

    inOrder(root);
    std::cout << "\\n\\nTraversal completed successfully.\\n";
    return 0;
}
`
  },
  {
    id: 'concurrency',
    name: 'Thread Concurrency',
    category: 'Multithreading',
    badge: '<thread>',
    color: '#F282A7',
    textColor: '#1E1E1E',
    folder: 'src/concurrency',
    description: 'Worker threads with mutex synchronization',
    content: `#include <iostream>
#include <thread>
#include <vector>
#include <mutex>

std::mutex cout_mutex;

void worker(int id, int workUnits) {
    {
        std::lock_guard<std::mutex> lock(cout_mutex);
        std::cout << "🧵 Worker #" << id << " started with " << workUnits << " tasks\\n";
    }
    
    // Simulate work
    long long sum = 0;
    for (int i = 0; i < workUnits * 1000000; ++i) {
        sum += (i % 3);
    }

    {
        std::lock_guard<std::mutex> lock(cout_mutex);
        std::cout << "✅ Worker #" << id << " finished (Check sum: " << sum << ")\\n";
    }
}

int main() {
    std::cout << "🚀 Launching Thread Pool Demo:\\n";
    std::vector<std::thread> threads;

    for (int i = 1; i <= 4; ++i) {
        threads.emplace_back(worker, i, i * 2);
    }

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "\\n🎉 All concurrent tasks joined cleanly!\\n";
    return 0;
}
`
  },
  {
    id: 'algorithms',
    name: 'QuickSort & Partition',
    category: 'Algorithms',
    badge: '<algorithm>',
    color: '#F0A77A',
    textColor: '#1E1E1E',
    folder: 'src/algorithms',
    description: 'Hoare partition algorithm with recursion',
    content: `#include <iostream>
#include <vector>
#include <utility>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);

    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return (i + 1);
}

void quickSort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    std::vector<int> data = {64, 34, 25, 12, 22, 11, 90, 88, 45, 7};
    std::cout << "Original Array: ";
    for (int x : data) std::cout << x << " ";
    std::cout << "\\n";

    quickSort(data, 0, data.size() - 1);

    std::cout << "Sorted Array:   ";
    for (int x : data) std::cout << x << " ";
    std::cout << "\\n";
    return 0;
}
`
  },
  {
    id: 'lru',
    name: 'LRU Cache (O(1))',
    category: 'System Design',
    badge: 'LRU Cache',
    color: '#C1DA90',
    textColor: '#1E1E1E',
    folder: 'src/data_structures',
    description: 'Constant time hashmap and doubly linked list cache',
    content: `#include <iostream>
#include <unordered_map>
#include <list>

class LRUCache {
    int capacity;
    std::list<std::pair<int, int>> items;
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> cacheMap;

public:
    LRUCache(int cap) : capacity(cap) {}

    int get(int key) {
        if (cacheMap.find(key) == cacheMap.end()) return -1;
        items.splice(items.begin(), items, cacheMap[key]);
        return cacheMap[key]->second;
    }

    void put(int key, int value) {
        if (cacheMap.find(key) != cacheMap.end()) {
            items.splice(items.begin(), items, cacheMap[key]);
            cacheMap[key]->second = value;
            return;
        }
        if (items.size() == capacity) {
            int oldKey = items.back().first;
            items.pop_back();
            cacheMap.erase(oldKey);
        }
        items.emplace_front(key, value);
        cacheMap[key] = items.begin();
    }
};

int main() {
    LRUCache lru(2);
    lru.put(1, 100);
    lru.put(2, 200);
    std::cout << "Get key 1: " << lru.get(1) << " (Expected 100)\\n";
    lru.put(3, 300); // evicts key 2
    std::cout << "Get key 2: " << lru.get(2) << " (Expected -1, evicted)\\n";
    std::cout << "Get key 3: " << lru.get(3) << " (Expected 300)\\n";
    return 0;
}
`
  },
  {
    id: 'chrono',
    name: 'Benchmark & Chrono',
    category: 'Performance',
    badge: '<chrono>',
    color: '#B2C9DA',
    textColor: '#1E1E1E',
    folder: 'src/benchmarks',
    description: 'High-resolution nanosecond clock and memory profiling',
    content: `#include <iostream>
#include <chrono>
#include <vector>
#include <numeric>

int main() {
    const int N = 5000000;
    std::cout << "⏱️ Benchmarking std::vector sum of " << N << " elements...\\n";

    auto start = std::chrono::high_resolution_clock::now();

    std::vector<long long> vec(N, 1);
    long long total = std::accumulate(vec.begin(), vec.end(), 0LL);

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> elapsed = end - start;

    std::cout << "Total Computed: " << total << "\\n";
    std::cout << "Elapsed Time:   " << elapsed.count() << " ms\\n";
    return 0;
}
`
  }
];
