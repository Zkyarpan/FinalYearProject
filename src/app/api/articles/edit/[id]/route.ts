'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Article from '@/models/Articles';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/fileUpload';
import { cleanContent } from '@/utils/contentCleaner';

// GET route to retrieve article for editing
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const articleId = params.id;

      console.log(`Fetching article for edit: ${articleId} by user ${user.id}`);

      // Find the article
      const article = await Article.findById(articleId);

      if (!article) {
        return NextResponse.json(
          createErrorResponse(404, 'Article not found'),
          { status: 404 }
        );
      }

      // Check if the user is the author
      if (article.author.toString() !== user.id) {
        return NextResponse.json(
          createErrorResponse(
            403,
            'You do not have permission to edit this article'
          ),
          { status: 403 }
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Article fetched for editing',
          article,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Failed to fetch article for editing:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}

// PATCH route to update the article
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const articleId = params.id;

      console.log(`Updating article: ${articleId} by user ${user.id}`);

      // Find the article and validate ownership
      const article = await Article.findById(articleId);

      if (!article) {
        return NextResponse.json(
          createErrorResponse(404, 'Article not found'),
          { status: 404 }
        );
      }

      // Check if the user is the author
      if (article.author.toString() !== user.id) {
        return NextResponse.json(
          createErrorResponse(
            403,
            'You do not have permission to edit this article'
          ),
          { status: 403 }
        );
      }

      // Parse the form data
      const formData = await req.formData();
      const updateData: any = {};
      let imageFile: any = null;

      // Get fields data
      const fieldsStr = formData.get('fields');
      if (fieldsStr) {
        const fields = JSON.parse(String(fieldsStr));

        // Clean content if provided
        if (fields.content) {
          fields.content = cleanContent(fields.content);
        }

        Object.assign(updateData, fields);
      }

      // Handle image upload if provided
      const articleImage = formData.get('articleImage');
      if (articleImage instanceof Blob) {
        const timestamp = Date.now();
        imageFile = {
          buffer: Buffer.from(await articleImage.arrayBuffer()),
          filename: `article-${article._id}-${timestamp}`,
          mimetype: articleImage.type,
        };
      }

      if (imageFile) {
        try {
          // Delete the old image if it exists
          if (article.articleImage) {
            const publicIdMatch = article.articleImage.match(
              /photos\/article-images\/([^.]+)/
            );
            const oldPublicId = publicIdMatch ? publicIdMatch[1] : null;

            if (oldPublicId) {
              try {
                await deleteFromCloudinary(
                  `photos/article-images/${oldPublicId}`
                );
              } catch (deleteError) {
                console.error('Error deleting old image:', deleteError);
              }
            }
          }

          // Upload the new image
          const newImageUrl = await uploadToCloudinary({
            fileBuffer: imageFile.buffer,
            folder: 'photos/article-images',
            filename: imageFile.filename,
            mimetype: imageFile.mimetype,
          });

          updateData.articleImage = newImageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return NextResponse.json(
            createErrorResponse(400, 'Failed to upload image'),
            { status: 400 }
          );
        }
      }

      console.log('Updating article with data:', {
        articleId: article._id,
        updateFields: Object.keys(updateData),
      });

      // Update the article
      const updatedArticle = await Article.findByIdAndUpdate(
        article._id,
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      ).exec();

      if (!updatedArticle) {
        return NextResponse.json(
          createErrorResponse(404, 'Failed to update article'),
          { status: 404 }
        );
      }

      console.log('Article updated successfully:', updatedArticle._id);

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Article updated successfully',
          article: updatedArticle,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Server Error:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}
