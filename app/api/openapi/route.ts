import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openapi: "3.0.3",
    info: {
      title: "Rekkomo API",
      version: "0.1.0",
    },
    paths: {
      "/api/auth/register": {
        post: { summary: "Register with email/password" },
      },
      "/api/communities": {
        get: { summary: "List communities" },
        post: { summary: "Create community" },
      },
      "/api/communities/{slug}": {
        get: { summary: "Get community" },
      },
      "/api/communities/{slug}/join": {
        post: { summary: "Join community" },
      },
      "/api/communities/{slug}/leave": {
        post: { summary: "Leave community" },
      },
      "/api/communities/{slug}/posts": {
        get: { summary: "List posts in community" },
      },
      "/api/posts": {
        post: { summary: "Create post" },
      },
      "/api/posts/{id}": {
        get: { summary: "Get post" },
      },
      "/api/posts/{id}/comment": {
        post: { summary: "Add comment" },
      },
      "/api/posts/{id}/react": {
        post: { summary: "React to post" },
      },
      "/api/report": {
        post: { summary: "Report content" },
      },
      "/api/follow/{userId}": {
        post: { summary: "Follow user" },
        delete: { summary: "Unfollow user" },
      },
      "/api/follow/status/{userId}": {
        get: { summary: "Follow status" },
      },
      "/api/followers/{userId}": {
        get: { summary: "List followers" },
      },
      "/api/following/{userId}": {
        get: { summary: "List following" },
      },
      "/api/people/suggestions": {
        get: { summary: "Suggested people" },
      },
      "/api/people/search": {
        get: { summary: "Search people" },
      },
      "/api/activity/following": {
        get: { summary: "Following activity feed" },
      },
    },
  });
}
