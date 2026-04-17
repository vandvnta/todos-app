<?php

namespace Database\Seeders;

use App\Models\Todo;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::factory()->create([
            'name'  => 'Test User',
            'email' => 'test@example.com',
        ]);

        $todos = [
            ['title' => 'Set up Docker environment',   'description' => 'Configure Docker Compose for Laravel + React.', 'status' => 'completed'],
            ['title' => 'Build Laravel REST API',       'description' => 'Create auth and todo endpoints with Sanctum.',   'status' => 'completed'],
            ['title' => 'Build ReactJS frontend',       'description' => 'Login, Register, and Todos pages with Tailwind.','status' => 'in_progress'],
            ['title' => 'Write API tests',              'description' => 'Cover all endpoints with feature tests.',         'status' => 'pending'],
            ['title' => 'Deploy to production',         'description' => null,                                              'status' => 'pending'],
        ];

        foreach ($todos as $todo) {
            Todo::create([...$todo, 'user_id' => $user->id]);
        }
    }
}
