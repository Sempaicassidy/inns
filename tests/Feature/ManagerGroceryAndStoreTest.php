<?php

namespace Tests\Feature;

use App\Models\BusinessDate;
use App\Models\InventoryItem;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagerGroceryAndStoreTest extends TestCase
{
    use RefreshDatabase;

    protected User $manager;
    protected Tenant $tenant;
    protected Property $property;
    protected PosCategory $groceryCategory;
    protected PosCategory $restaurantCategory;
    protected PosItem $groceryItem;
    protected PosItem $restaurantItem;
    protected InventoryItem $inventoryItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'The Inns Group',
            'slug' => 'the-inns',
            'plan' => 'Professional',
        ]);

        $this->property = Property::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'The Inns Downtown',
            'code' => 'TIN-01',
            'currency' => 'TZS',
        ]);

        BusinessDate::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'current_business_date' => Carbon::today()->toDateString(),
            'roll_state' => 'open',
        ]);

        $this->manager = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'role' => 'general_manager',
        ]);

        // 1. Independent Grocery Category & Item
        $this->groceryCategory = PosCategory::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'department' => 'grocery',
            'name' => 'Grocery & Retail Minimart',
            'icon' => 'shopping-bag',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->groceryItem = PosItem::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'pos_category_id' => $this->groceryCategory->id,
            'department' => 'grocery',
            'name' => 'Cashew Nuts 200g',
            'code' => 'GRO-CSH-01',
            'price_minor' => 800000,
            'cost_price_minor' => 500000,
            'stock_quantity' => 20,
            'reorder_level' => 5,
            'unit' => 'pkt',
            'is_available' => true,
        ]);

        // 2. Independent Restaurant Category & Item
        $this->restaurantCategory = PosCategory::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'department' => 'restaurant',
            'name' => 'Main Dining & Grills',
            'icon' => 'utensils',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->restaurantItem = PosItem::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'pos_category_id' => $this->restaurantCategory->id,
            'department' => 'restaurant',
            'name' => 'Grilled Prime Beef Tenderloin',
            'code' => 'RST-BEEF-01',
            'price_minor' => 3200000,
            'cost_price_minor' => 1800000,
            'stock_quantity' => 0,
            'reorder_level' => 0,
            'unit' => 'portion',
            'is_available' => true,
        ]);

        // 3. Central Store Inventory Item
        $this->inventoryItem = InventoryItem::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'sku' => 'LIN-101',
            'name' => 'Luxury Bath Towels',
            'department' => 'linens',
            'unit' => 'pcs',
            'current_quantity' => 50,
            'reorder_level' => 15,
            'unit_cost_minor' => 2500000,
            'notes' => 'Primary store item',
            'is_active' => true,
        ]);
    }

    public function test_manager_can_access_restaurant_portal(): void
    {
        PosOrder::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'user_id' => $this->manager->id,
            'order_number' => 'ORD-REST-001',
            'outlet_type' => 'restaurant',
            'order_type' => 'dine_in',
            'subtotal_minor' => 15000,
            'tax_minor' => 0,
            'total_minor' => 15000,
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->manager)->get('/restaurant');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Restaurant/Index')
            ->has('metrics')
            ->has('items')
            ->has('categories')
            ->has('recentOrders', 1)
            ->has('topSelling')
        );
    }

    public function test_restaurant_and_grocery_are_completely_independent(): void
    {
        // Grocery portal must ONLY contain grocery items, not steaks or dishes
        $groceryResp = $this->actingAs($this->manager)->get('/grocery');
        $groceryResp->assertStatus(200);
        $groceryItems = $groceryResp->inertiaProps('items');
        $this->assertCount(1, $groceryItems);
        $this->assertEquals('Cashew Nuts 200g', $groceryItems[0]['name']);

        // Restaurant portal must ONLY contain restaurant dishes, not packaged retail snacks
        $restaurantResp = $this->actingAs($this->manager)->get('/restaurant');
        $restaurantResp->assertStatus(200);
        $restaurantItems = $restaurantResp->inertiaProps('items');
        $this->assertCount(1, $restaurantItems);
        $this->assertEquals('Grilled Prime Beef Tenderloin', $restaurantItems[0]['name']);

        // Waitstaff POS must also only receive restaurant items
        $posResp = $this->actingAs($this->manager)->get('/pos');
        $posResp->assertStatus(200);
        $posItems = $posResp->inertiaProps('items');
        $this->assertCount(1, $posItems);
        $this->assertEquals('Grilled Prime Beef Tenderloin', $posItems[0]['name']);
    }

    public function test_manager_can_add_restaurant_dish(): void
    {
        $response = $this->actingAs($this->manager)->post('/restaurant/items', [
            'pos_category_id' => $this->restaurantCategory->id,
            'name' => 'Swahili Coconut Fish Curry',
            'code' => 'RST-FISH-02',
            'price' => 28000,
            'cost_price' => 14000,
            'unit' => 'plate',
            'description' => 'Local ocean fish with spices',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('pos_items', [
            'name' => 'Swahili Coconut Fish Curry',
            'department' => 'restaurant',
            'price_minor' => 2800000,
        ]);
    }

    public function test_manager_can_toggle_dish_kitchen_availability(): void
    {
        $this->assertTrue((bool) $this->restaurantItem->is_available);

        $response = $this->actingAs($this->manager)->post("/restaurant/items/{$this->restaurantItem->id}/toggle-availability");
        $response->assertSessionHasNoErrors();

        $this->restaurantItem->refresh();
        $this->assertFalse((bool) $this->restaurantItem->is_available);
    }

    public function test_manager_can_access_grocery_portal(): void
    {
        $response = $this->actingAs($this->manager)->get('/grocery');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Grocery/Index')
            ->has('metrics')
            ->has('items')
            ->has('categories')
        );
    }

    public function test_manager_can_add_grocery_product(): void
    {
        $response = $this->actingAs($this->manager)->post('/grocery/items', [
            'pos_category_id' => $this->groceryCategory->id,
            'name' => 'Mineral Water 1L',
            'code' => 'GRO-WAT-02',
            'price' => 2000,
            'cost_price' => 1200,
            'stock_quantity' => 40,
            'reorder_level' => 10,
            'unit' => 'bottle',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('pos_items', [
            'name' => 'Mineral Water 1L',
            'department' => 'grocery',
            'stock_quantity' => 40,
        ]);
    }

    public function test_manager_can_restock_grocery_product(): void
    {
        $response = $this->actingAs($this->manager)->post("/grocery/items/{$this->groceryItem->id}/restock", [
            'add_quantity' => 30,
            'unit_cost' => 5500,
            'reference_no' => 'GRN-TEST-1',
            'notes' => 'Received from supplier',
        ]);

        $response->assertSessionHasNoErrors();
        $this->groceryItem->refresh();
        $this->assertEquals(50, $this->groceryItem->stock_quantity);
    }

    public function test_manager_can_process_independent_grocery_sale(): void
    {
        $initialStock = $this->groceryItem->stock_quantity;

        $response = $this->actingAs($this->manager)->post('/grocery/orders', [
            'payment_method' => 'cash',
            'guest_name' => 'Walk-In Customer',
            'items' => [
                [
                    'item_id' => $this->groceryItem->id,
                    'quantity' => 3,
                ],
            ],
            'notes' => 'Retail counter purchase',
        ]);

        $response->assertSessionHasNoErrors();

        // 1. Stock must be deducted
        $this->groceryItem->refresh();
        $this->assertEquals($initialStock - 3, $this->groceryItem->stock_quantity);

        // 2. Order must be recorded with outlet_type = grocery
        $this->assertDatabaseHas('pos_orders', [
            'outlet_type' => 'grocery',
            'payment_method' => 'cash',
            'total_minor' => 2400000, // 3 x 800000
        ]);

        // 3. Stock movement must be recorded
        $this->assertDatabaseHas('stock_movements', [
            'pos_item_id' => $this->groceryItem->id,
            'movement_type' => 'issue_department',
            'quantity' => 3,
        ]);
    }

    public function test_manager_can_access_central_store_portal(): void
    {
        $response = $this->actingAs($this->manager)->get('/inventory');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Inventory/Index')
            ->has('metrics')
            ->has('items')
            ->has('byDepartment')
            ->has('movements')
        );
    }

    public function test_manager_can_receive_store_stock(): void
    {
        $response = $this->actingAs($this->manager)->post('/inventory/receive', [
            'item_id' => $this->inventoryItem->id,
            'quantity' => 25,
            'unit_cost' => 26000,
            'reference_no' => 'GRN-STORE-99',
            'notes' => 'New towels received from mill',
        ]);

        $response->assertSessionHasNoErrors();
        $this->inventoryItem->refresh();
        $this->assertEquals(75, $this->inventoryItem->current_quantity);
    }

    public function test_manager_can_issue_department_requisition(): void
    {
        $response = $this->actingAs($this->manager)->post('/inventory/issue', [
            'item_id' => $this->inventoryItem->id,
            'quantity' => 10,
            'department' => 'Housekeeping Floor 2',
            'recipient_name' => 'Baraka Supervisor',
            'reference_no' => 'REQ-HK-001',
            'notes' => 'Floor turnover restock',
        ]);

        $response->assertSessionHasNoErrors();
        $this->inventoryItem->refresh();
        $this->assertEquals(40, $this->inventoryItem->current_quantity);
    }

    public function test_manager_can_adjust_store_damage(): void
    {
        $response = $this->actingAs($this->manager)->post('/inventory/adjust', [
            'item_id' => $this->inventoryItem->id,
            'adjustment_type' => 'damage',
            'quantity' => 2,
            'notes' => 'Torn during transport',
        ]);

        $response->assertSessionHasNoErrors();
        $this->inventoryItem->refresh();
        $this->assertEquals(48, $this->inventoryItem->current_quantity);
    }
}
