'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Article from '@/models/Articles';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { uploadToCloudinary } from '@/utils/fileUpload';
import { cleanContent } from '@/utils/contentCleaner';

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      console.log('Creating a new article');

      // Parse form data
      const formData = await req.formData();
      const articleData: any = {};
      let imageFile: any = null;

      // Get fields data
      const fieldsStr = formData.get('fields');
      if (fieldsStr) {
        const fields = JSON.parse(String(fieldsStr));

        // Clean content
        if (fields.content) {
          fields.content = cleanContent(fields.content);
        }

        Object.assign(articleData, fields);
      }

      // Handle image upload
      const articleImage = formData.get('articleImage');
      if (articleImage instanceof Blob) {
        const timestamp = Date.now();
        imageFile = {
          buffer: Buffer.from(await articleImage.arrayBuffer()),
          filename: `article-${timestamp}`,
          mimetype: articleImage.type,
        };
      }

      if (imageFile) {
        try {
          const imageUrl = await uploadToCloudinary({
            fileBuffer: imageFile.buffer,
            folder: 'photos/article-images',
            filename: imageFile.filename,
            mimetype: imageFile.mimetype,
          });

          articleData.articleImage = imageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return NextResponse.json(
            createErrorResponse(400, 'Failed to upload image'),
            { status: 400 }
          );
        }
      }

      // Add author information
      articleData.author = user.id;
      articleData.authorType =
        user.role === 'psychologist' ? 'psychologist' : 'user';

      console.log('Creating article with data:', {
        title: articleData.title,
        category: articleData.category,
        authorType: articleData.authorType,
      });

      // Create the article
      const article = new Article(articleData);
      await article.save();

      return NextResponse.json(
        createSuccessResponse(201, {
          message: 'Article created successfully',
          article,
        }),
        { status: 201 }
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
