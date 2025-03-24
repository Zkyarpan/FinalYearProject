'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Article from '@/models/Articles'; 
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { deleteFromCloudinary } from '@/utils/fileUpload';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const articleId = params.id;

      console.log(`[DELETE] Attempting to delete article: ${articleId} by user ${user.id}`);

      // Validate articleId format
      if (!articleId || !/^[0-9a-fA-F]{24}$/.test(articleId)) {
        console.error(`[DELETE] Invalid article ID format: ${articleId}`);
        return NextResponse.json(
          createErrorResponse(400, 'Invalid article ID format'),
          { status: 400 }
        );
      }

      // Find the article
      const article = await Article.findById(articleId);

      if (!article) {
        console.error(`[DELETE] Article not found with ID: ${articleId}`);
        return NextResponse.json(
          createErrorResponse(404, 'Article not found'),
          { status: 404 }
        );
      }

      // Check if the user is the author
      if (article.author.toString() !== user.id) {
        console.error(`[DELETE] Permission denied for user ${user.id} to delete article ${articleId}`);
        return NextResponse.json(
          createErrorResponse(
            403,
            'You do not have permission to delete this article'
          ),
          { status: 403 }
        );
      }

      // Delete associated image if it exists
      if (article.articleImage) {
        const publicIdMatch = article.articleImage.match(
          /photos\/article-images\/([^.]+)/
        );
        const publicId = publicIdMatch ? publicIdMatch[1] : null;

        if (publicId) {
          try {
            await deleteFromCloudinary(`photos/article-images/${publicId}`);
            console.log(`[DELETE] Deleted image for article: ${articleId}`);
          } catch (deleteError) {
            console.error('[DELETE] Error deleting image:', deleteError);
            // Continue with article deletion even if image deletion fails
          }
        }
      }

      // Delete the article
      const result = await Article.findByIdAndDelete(articleId);
      
      if (!result) {
        console.error(`[DELETE] Failed to delete article ${articleId} from database`);
        return NextResponse.json(
          createErrorResponse(500, 'Failed to delete article from database'),
          { status: 500 }
        );
      }

      console.log(`[DELETE] Successfully deleted article: ${articleId}`);
      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Article deleted successfully',
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('[DELETE] Server Error:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}