<?php

namespace Database\Seeders;

use App\Models\InventoryItem;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\Property;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class StoreAndGrocerySeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        $property = Property::first();
        $user = User::first();

        if (! $tenant || ! $property) {
            return;
        }

        // 1. Seed Store Inventory Items if empty
        if (InventoryItem::count() === 0) {
            $items = [
                // Linens & Housekeeping
                ['sku' => 'LIN-001', 'name' => 'Egyptian Cotton Bed Sheets (King)', 'department' => 'linens', 'unit' => 'sets', 'current_quantity' => 45, 'reorder_level' => 15, 'unit_cost_minor' => 6500000],
                ['sku' => 'LIN-002', 'name' => 'Luxury White Bath Towels 700gsm', 'department' => 'linens', 'unit' => 'pcs', 'current_quantity' => 120, 'reorder_level' => 30, 'unit_cost_minor' => 2800000],
                ['sku' => 'LIN-003', 'name' => 'Waffle Weave Hotel Bathrobes', 'department' => 'linens', 'unit' => 'pcs', 'current_quantity' => 28, 'reorder_level' => 10, 'unit_cost_minor' => 4500000],
                ['sku' => 'LIN-004', 'name' => 'Hypoallergenic Pillowcases', 'department' => 'linens', 'unit' => 'pcs', 'current_quantity' => 85, 'reorder_level' => 25, 'unit_cost_minor' => 1200000],

                // Amenities
                ['sku' => 'AMN-101', 'name' => 'Eco Botanical Shampoo 50ml', 'department' => 'amenities', 'unit' => 'bottles', 'current_quantity' => 350, 'reorder_level' => 100, 'unit_cost_minor' => 250000],
                ['sku' => 'AMN-102', 'name' => 'Moisturizing Body Lotion 50ml', 'department' => 'amenities', 'unit' => 'bottles', 'current_quantity' => 290, 'reorder_level' => 100, 'unit_cost_minor' => 250000],
                ['sku' => 'AMN-103', 'name' => 'Bamboo Toothbrush & Paste Kit', 'department' => 'amenities', 'unit' => 'boxes', 'current_quantity' => 18, 'reorder_level' => 50, 'unit_cost_minor' => 350000], // Low stock
                ['sku' => 'AMN-104', 'name' => 'Luxury Vanity & Shaving Kit', 'department' => 'amenities', 'unit' => 'boxes', 'current_quantity' => 0, 'reorder_level' => 40, 'unit_cost_minor' => 450000], // Depleted

                // Kitchen & Provisions
                ['sku' => 'KIT-201', 'name' => 'Basmati Rice Premium (25kg Bag)', 'department' => 'kitchen', 'unit' => 'bags', 'current_quantity' => 14, 'reorder_level' => 5, 'unit_cost_minor' => 8500000],
                ['sku' => 'KIT-202', 'name' => 'Extra Virgin Olive Oil (5L Tin)', 'department' => 'kitchen', 'unit' => 'tins', 'current_quantity' => 8, 'reorder_level' => 3, 'unit_cost_minor' => 9500000],
                ['sku' => 'KIT-203', 'name' => 'Kilimanjaro AA Coffee Beans (5kg)', 'department' => 'kitchen', 'unit' => 'bags', 'current_quantity' => 6, 'reorder_level' => 2, 'unit_cost_minor' => 12000000],
                ['sku' => 'KIT-204', 'name' => 'Refined Cane Sugar (50kg Bag)', 'department' => 'kitchen', 'unit' => 'bags', 'current_quantity' => 3, 'reorder_level' => 2, 'unit_cost_minor' => 14500000],

                // Beverage & Bar Cellar
                ['sku' => 'BEV-301', 'name' => 'Serengeti Premium Lager (Crate 24x500ml)', 'department' => 'beverage', 'unit' => 'crates', 'current_quantity' => 25, 'reorder_level' => 8, 'unit_cost_minor' => 6800000],
                ['sku' => 'BEV-302', 'name' => 'Kilimanjaro Natural Spring Water 1.5L (Case 12)', 'department' => 'beverage', 'unit' => 'cases', 'current_quantity' => 40, 'reorder_level' => 15, 'unit_cost_minor' => 1800000],
                ['sku' => 'BEV-303', 'name' => 'Robertson Winery Cabernet Sauvignon 750ml', 'department' => 'beverage', 'unit' => 'bottles', 'current_quantity' => 19, 'reorder_level' => 6, 'unit_cost_minor' => 2800000],

                // Maintenance & Spares
                ['sku' => 'MNT-401', 'name' => 'Warm White LED Bulb 9W E27', 'department' => 'maintenance', 'unit' => 'pcs', 'current_quantity' => 60, 'reorder_level' => 20, 'unit_cost_minor' => 650000],
                ['sku' => 'MNT-402', 'name' => 'RFID Encrypted Keycards (Pack of 50)', 'department' => 'maintenance', 'unit' => 'packs', 'current_quantity' => 2, 'reorder_level' => 3, 'unit_cost_minor' => 7500000], // Low stock
            ];

            foreach ($items as $itemData) {
                $item = InventoryItem::create([
                    'tenant_id' => $tenant->id,
                    'property_id' => $property->id,
                    'sku' => $itemData['sku'],
                    'name' => $itemData['name'],
                    'department' => $itemData['department'],
                    'unit' => $itemData['unit'],
                    'current_quantity' => $itemData['current_quantity'],
                    'reorder_level' => $itemData['reorder_level'],
                    'unit_cost_minor' => $itemData['unit_cost_minor'],
                    'notes' => 'Central warehouse primary catalog item',
                ]);

                // Create initial stock movement
                StockMovement::create([
                    'tenant_id' => $tenant->id,
                    'property_id' => $property->id,
                    'inventory_item_id' => $item->id,
                    'movement_type' => 'receive_stock',
                    'quantity' => $itemData['current_quantity'],
                    'unit_cost_minor' => $itemData['unit_cost_minor'],
                    'department' => 'central_store',
                    'reference_no' => 'INIT-STOCK-' . date('Y'),
                    'notes' => 'Opening balance from central warehouse audit',
                    'performed_by' => $user?->id,
                ]);
            }
        }

        // 2. Seed Grocery Category & Items if not present
        $groceryCategory = PosCategory::where('name', 'Grocery & Retail Minimart')->first();
        if (! $groceryCategory) {
            $groceryCategory = PosCategory::create([
                'tenant_id' => $tenant->id,
                'property_id' => $property->id,
                'department' => 'grocery',
                'name' => 'Grocery & Retail Minimart',
                'icon' => 'shopping-bag',
                'sort_order' => 4,
                'is_active' => true,
            ]);

            $groceryItems = [
                ['name' => 'Kilimanjaro Mineral Water 500ml', 'code' => 'GRO-WAT-01', 'price_minor' => 150000, 'cost_price_minor' => 80000, 'stock_quantity' => 75, 'reorder_level' => 20, 'unit' => 'bottle'],
                ['name' => 'Savanna Crisps Salt & Vinegar 150g', 'code' => 'GRO-SNK-02', 'price_minor' => 450000, 'cost_price_minor' => 280000, 'stock_quantity' => 32, 'reorder_level' => 10, 'unit' => 'pkt'],
                ['name' => 'Cadbury Dairy Milk Chocolate 80g', 'code' => 'GRO-CNF-03', 'price_minor' => 600000, 'cost_price_minor' => 380000, 'stock_quantity' => 24, 'reorder_level' => 8, 'unit' => 'bar'],
                ['name' => 'Colgate Total Toothpaste 100ml', 'code' => 'GRO-HYG-04', 'price_minor' => 500000, 'cost_price_minor' => 300000, 'stock_quantity' => 14, 'reorder_level' => 5, 'unit' => 'tube'],
                ['name' => 'Nivea Refreshing Sun Spray SPF50', 'code' => 'GRO-SUN-05', 'price_minor' => 3200000, 'cost_price_minor' => 2200000, 'stock_quantity' => 8, 'reorder_level' => 5, 'unit' => 'can'],
                ['name' => 'Universal Travel Plug Adapter UK/EU/US', 'code' => 'GRO-ELC-06', 'price_minor' => 2500000, 'cost_price_minor' => 1400000, 'stock_quantity' => 11, 'reorder_level' => 5, 'unit' => 'pcs'],
                ['name' => 'Fresh Roasted Mixed Cashews 200g', 'code' => 'GRO-SNK-07', 'price_minor' => 950000, 'cost_price_minor' => 600000, 'stock_quantity' => 19, 'reorder_level' => 6, 'unit' => 'tin'],
                ['name' => 'Ceres 100% Fruit Juice Apple 1L', 'code' => 'GRO-BEV-08', 'price_minor' => 650000, 'cost_price_minor' => 420000, 'stock_quantity' => 28, 'reorder_level' => 8, 'unit' => 'carton'],
            ];

            foreach ($groceryItems as $g) {
                PosItem::create([
                    'tenant_id' => $tenant->id,
                    'property_id' => $property->id,
                    'pos_category_id' => $groceryCategory->id,
                    'department' => 'grocery',
                    'name' => $g['name'],
                    'code' => $g['code'],
                    'price_minor' => $g['price_minor'],
                    'cost_price_minor' => $g['cost_price_minor'],
                    'stock_quantity' => $g['stock_quantity'],
                    'reorder_level' => $g['reorder_level'],
                    'unit' => $g['unit'],
                    'is_available' => true,
                ]);
            }
        }
    }
}

