import { Request, Response } from "express";
import Category from "../models/Category";

export const addCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let { category } = req.body;

    const isCategory = await Category.findOne({ category: category });
    if (isCategory) {
      res.status(200).json({ message: "exists" });
      return;
    }

    await Category.create({
      category,
    });
    res.send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
};


export const getCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const isCategory = await Category.find();
    if (isCategory) {
      res.status(200).json({categories:isCategory});
      return;
    }
    
  } catch (e) {
    console.log(e);
    res.send(e);
  }
};
