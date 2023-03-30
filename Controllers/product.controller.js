import Mongoose from 'mongoose';
import formidable from 'formidable';
import fs from 'fs';
import Product from '../models/product.schema.js';
import { s3FileUpload, deleteFile } from '../services/imageUpload';
import CustomError from '../utils/customError';
import asyncHandler from '../services/asyncHandler';
import config from '../config/index.js';

/*****************************************
 * @ADD_PRODUCT
 * @Request_Type    POST
 * @route           /api/product
 * @description     controller for creating a new product
 * @parameters
 * @returns         product object
 *****************************************/
export const addProduct = asyncHandler(async (req, res) => {
  const form = formidable({
    multiples: true,
    keepExtensions: true,
  });

  form.parse(req, async function (err, fields, files) {
    try {
      if (err) {
        throw new CustomError(err.message || 'Something went wrong', 500);
      }

      let productId = new Mongoose.Types.ObjectId().toHexString();
      console.log(fields, files);

      // check for fields
      if (
        !fields.name ||
        !fields.price ||
        !fields.description ||
        !fields.collectionId
      ) {
        throw new CustomError('Please fill all details');
      }

      // handling images
      let imgArrayResp = Promise.all(
        Object.keys(files).map(async (filekey, index) => {
          const element = files[filekey];

          const data = fs.readFileSync(element.filepath);
          const upload = await s3FileUpload({
            bucketName: config.S3_BUCKET_NAME,
            key: `products/${productId}/photo_${index + 1}.png`,
            body: data,
            contentType: element.mimetype,
          });
          return {
            secure_url: upload.Location,
          };
        })
      );

      let imgArray = await imgArrayResp;

      const product = await Product.create({
        _id: productId,
        photos: imgArray,
        ...fields,
      });

      if (!product) {
        throw new CustomError('Product was not created', 400);
      }

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Something went wrong',
      });
    }
  });
});
