import express, { Request, Response } from "express";
import multer from 'multer'
import cloudinary from "cloudinary"
import Hotel from "../models/hotel";
import { HotelType } from "../shared/types";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";

const router = express.Router();

//tao kho luu tru du lieu tai len tren buffer trong RAM tren server
const storage = multer.memoryStorage()
const upload = multer({
    storage: storage,
    limits:{
        fileSize: 5 * 1024 * 1024 // 5MB
    }
})

// api/my-hotels

// 1. upload the images to cloudinary
// 2. if upload was successfulll -> add the URLs to the newHotel
// 3. save newHotel to db
//4. return a 201 status
router.post("/",verifyToken , [
        body("name").notEmpty().withMessage('Name is required'),
        body("city").notEmpty().withMessage('City is required'),
        body("country").notEmpty().withMessage('Country is required'),
        body("description").notEmpty().withMessage('Description is required'),
        body("type").notEmpty().withMessage('Type is required'),
        body("pricePerNight").notEmpty().isNumeric().withMessage("Price per night is required and must be a number"),
        body("facilities").notEmpty().isArray().withMessage('Facilities are required'),
    ],
    upload.array("imageFiles",6), async (req: Request, res: Response) => {
    try{
        const imageFiles = req.files as Express.Multer.File[]
        const newHotel: HotelType = req.body;

        const imageUrls = await uploadImages(imageFiles);

        newHotel.imageUrls = imageUrls
        newHotel.lastUpdated = new Date()
        newHotel.userId = req.userId;
        
        const hotel = new Hotel(newHotel);
        await hotel.save()

        res.status(201).send(hotel)

    }catch (err){
        console.log("Error creating hotel: ", err)
        res.status(500).json({
            message: "Something went wrong"
        })
    }
})

router.get("/", verifyToken, async(req: Request, res: Response) =>{

    try{
        const hotels = await Hotel.find({userId: req.userId})
        res.json(hotels)
    }catch (err){
        res.status(500).json({
            message: "Error fetching hotels"
        })
    }
})

router.get("/:id", verifyToken, async(req: Request, res: Response)=>{
    const id = req.params.id.toString()

    try{
        const hotel = await Hotel.findOne({
            _id:id,
            userId: req.userId,
        })

        res.json(hotel)

    }catch(err){
        res.status(500).json({
            message: "Error fetching hotel"
        })
    }
})

router.put("/:hotelId", verifyToken, upload.array("imageFiles"), async (req:Request, res: Response) => {
    try{
        const updateHotel: HotelType = req.body
        updateHotel.lastUpdated = new Date()
        const hotel = await Hotel.findOneAndUpdate({
            _id: req.params.hotelId,
            userId: req.userId,
        }, updateHotel,{new: true})

        if(!hotel){
            res.status(404).json("Hotel not found")
        }else{
            const files = req.files as Express.Multer.File[]
            const updateImageUrls = await uploadImages(files)
            
            hotel.imageUrls = [...updateImageUrls, ...(updateHotel.imageUrls || [])]

            await hotel.save()
            res.status(201).json(hotel);
        }
    }catch (err){
        res.status(500).json({
            message: "Something went throw"
        })
    }

})

async function uploadImages(imageFiles: Express.Multer.File[]) {
    const uploadPromises = imageFiles.map(async (image) => {
        const b64 = Buffer.from(image.buffer).toString("base64");
        let dataURI = "data:" + image.mimetype + ";base64," + b64;
        const res = await cloudinary.v2.uploader.upload(dataURI);
        return res.url;
    });

    //Doi tat ca promise trong uploadPromies hoan thanh
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
}
export default router

router.delete("/:userId", async (req: Request, res: Response) =>{
    try{
        const userId = req.params.userId
        console.log(userId)
        const result = await Hotel.deleteMany({ userId: userId });
        console.log(result)
            // Kiểm tra kết quả
        if (!result) {
            res.status(200).json({ message: "Delete Successful"});
        } else {
            res.status(404).json({ message: "No hotels found to delete" });
        }
        // res.status(200).json({message: "Delete Successful"});
    }catch(err){
        res.status(400).json({
            message: "Delete Failed"
        })
    }
})