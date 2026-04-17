<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password,
        ]);

        [$accessToken, $refreshToken] = $this->issueTokenPair($user);

        return response()->json([
            'message'       => 'User registered successfully.',
            'user'          => $user,
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'bearer',
            'expires_in'    => auth('api')->factory()->getTTL() * 60,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $accessToken = auth('api')->attempt($request->only('email', 'password'));

        if (! $accessToken) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        /** @var User $user */
        $user         = auth('api')->user();
        $refreshToken = $this->issueRefreshToken($user);

        return response()->json([
            'message'       => 'Login successful.',
            'user'          => $user,
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'bearer',
            'expires_in'    => auth('api')->factory()->getTTL() * 60,
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $refreshTokenStr = $request->bearerToken();

        if (! $refreshTokenStr) {
            return response()->json(['message' => 'Refresh token required.'], 401);
        }

        try {
            $payload = JWTAuth::setToken($refreshTokenStr)->getPayload();
        } catch (JWTException) {
            return response()->json(['message' => 'Invalid or expired refresh token.'], 401);
        }

        if ($payload->get('token_type') !== 'refresh') {
            return response()->json(['message' => 'Invalid token type.'], 401);
        }

        /** @var User $user */
        $user        = JWTAuth::setToken($refreshTokenStr)->toUser();
        $accessToken = JWTAuth::claims(['token_type' => 'access'])->fromUser($user);

        return response()->json([
            'access_token' => $accessToken,
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            auth('api')->logout();
        } catch (JWTException) {
            // Token already invalid — continue
        }

        // Blacklist refresh token if provided
        $refreshTokenStr = $request->input('refresh_token');
        if ($refreshTokenStr) {
            try {
                JWTAuth::setToken($refreshTokenStr)->invalidate(true);
            } catch (JWTException) {
                // Ignore
            }
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(): JsonResponse
    {
        return response()->json(auth('api')->user());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function issueTokenPair(User $user): array
    {
        $accessToken  = JWTAuth::claims(['token_type' => 'access'])->fromUser($user);
        $refreshToken = $this->issueRefreshToken($user);

        return [$accessToken, $refreshToken];
    }

    private function issueRefreshToken(User $user): string
    {
        return JWTAuth::claims([
            'token_type' => 'refresh',
            'exp'        => now()->addDays(7)->timestamp,
        ])->fromUser($user);
    }
}
