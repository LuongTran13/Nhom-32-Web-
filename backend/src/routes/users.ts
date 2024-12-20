import express, { Request, Response } from 'express';
import User from '../models/user';
import jwt from "jsonwebtoken"
import "dotenv/config"
import { check, validationResult } from 'express-validator';
import verifyToken from '../middleware/auth';
import { UserType } from '../shared/types';

const router = express.Router()

router.get("/me", verifyToken, async (req: Request, res: Response) =>{
    const userId = req.userId;
    try{
        const user = await User.findById(userId).select("-password")
        if(!user){
            res.status(400).json({message: "User not found"})
        }
        res.json(user)
    }catch (error){
        res.status(500).json({message: "Something went wrong"})
    }
})

// /api/users/register
router.post("/register", [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 8 or more characters required").isLength({
        min: 8,
    })
], async (req: Request, res: Response) => {

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        res.status(400).json({
            message: errors.array()
        })
    }else{
        try{
            let user = await User.findOne({
                email:req.body.email,
            });

            if(user){
            res.status(400).json({
                    message: "User already exists"
                })
            }else{
                user = new User(req.body)
                await user.save()

                const token = jwt.sign({
                    userId: user.id // la dang string cua user._id
                },
                process.env.JWT_SECRET_KEY as string,
                {
                    expiresIn : "1d",
                })

                res.cookie("auth_token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 86400000,
                })

                res.status(200).send({
                    message: "User Registered OK"
                });
            }
        }catch (error){
            console.log(error)
            res.status(500).send({
                message: "Something went wrong"
            })
        }
    }
})

router.get("/", async(req: Request, res: Response) =>{
    try{
        const users = await User.find({role: {$ne: "admin"}})
        res.json(users);
    }catch(err){
        res.status(400).json({
            message: ""
        })
    }
})

router.delete("/:id", async(req: Request, res: Response) =>{
    try{
        const userId = req.params.id
        const users = await User.findByIdAndDelete(
            {_id: userId},
        )
        res.status(200).json({message: "Delete Successful"});
    }catch(err){
        res.status(400).json({
            message: "Delete Failed"
        })
    }
})

router.put("/:id", async(req: Request, res: Response) =>{
    try{
        const userId = req.params.id
        const updateuser: UserType= req.body
        const user = await User.findByIdAndUpdate(
            {_id: userId},
            updateuser,
            {new: true}
        )

        // console.log(req.body)

        if(!user){
            res.status(404).json("user not found")
        }else{
            res.status(200).json({message: "Update Successful"});
        }
    }catch(err){
        res.status(400).json({
            message: "Update Failed"
        })
    }
})

export default router;