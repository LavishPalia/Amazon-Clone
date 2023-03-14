import Collection from '../models/collection.schema.js'
import CustomError from '../utils/customError'
import asyncHandler from '../services/asyncHandler.js'

/*****************************************
 * @Create_Collection
 * @Request_Type    POST
 * @route           /api/collection
 * @description     create a collection
 * @parameters      collection name
 * @returns         success message, collection details
 *****************************************/
export const createCollection = asyncHandler(async(req, res) => {
    const {name} = req.body;

    if(!name) {
        throw new CustomError('Collection name is required', 400);
    }

    const collection = await Collection.create({
        name
    })

    res.status(200).json({
        success: true,
        message: 'Collection created with success',
        collection
    })
})

/*****************************************
 * @Update_Collection
 * @Request_Type    POST
 * @route           /api/collection
 * @description     update a collection
 * @parameters      collection name, collection ID
 * @returns         success message, collection details
 *****************************************/
export const updateCollection = asyncHandler(async(req, res) => {
    const {id: collectionId} = req.params;
    const {name} = req.body;

    if(!name) {
        throw new CustomError('Collection name is required', 400);
    }

    let updatedCollection = await Collection.findByIdAndUpdate(
        collectionId,
        {
            name,
        },
        {
            new: true,
            runValidators: true
        }
    )

    if(!updateCollection) {
        throw new CustomError('Collection not found', 400);
    }
    res.status(200).json({
        success: true,
        message: 'Collection updated with success',
        updatedCollection
    })
})

/*****************************************
 * @Delete_Collection
 * @Request_Type    DELETE
 * @route           /api/collection
 * @description     delete a collection
 * @parameters      collection ID
 * @returns         success message
 *****************************************/
export const deleteCollection = asyncHandler(async(req, res) => {
    const {id: collectionId} = req.params;

    const collectionToDelete = await Collection.findByIdAndDelete(collectionId) 

    if(!collectionToDelete) {
        throw new CustomError('Collection not found', 400);
    }

    collectionToDelete.remove()

    res.status(200).json({
        success: true,
        message: 'Collection deleted successfully'
    })
})

/*****************************************
 * @GetAll_Collection
 * @Request_Type    GET
 * @route           /api/collection
 * @description     get all collections list
 * @parameters      none
 * @returns         a list of collections
 *****************************************/
export const getAllCollections = asyncHandler(async(req, res) => {

    let collections = await Collection.find();

    if(!collections) {
        throw new CustomError('No Collection found', 400);
    }
    res.status(200).json({
        success: true,
        collections
    })
})