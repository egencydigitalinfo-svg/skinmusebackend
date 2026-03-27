import Brand from "../models/Brands.js";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Products.js";

// Helper: delete images from Cloudinary
const deleteCloudinaryImage = async (url) => {
  if (!url) return;
  const parts = url.split("/");
  const fileName = parts[parts.length - 1].split(".")[0];
  const folder = parts[parts.length - 2];
  const public_id = `${folder}/${fileName}`;
  await cloudinary.uploader.destroy(public_id);
};

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// ✅ Update brand discount from its products
export const updateBrandDiscountFromProducts = async (brandId) => {
  try {
    const products = await Product.find({ brandId });

    if (!products || products.length === 0) {
      await Brand.findByIdAndUpdate(brandId, { discount: null });
      return;
    }

    const discounts = products
      .map((p) => p.discount)
      .filter((d) => d && d > 0);

    const highestDiscount = discounts.length > 0 ? Math.max(...discounts) : null;

    await Brand.findByIdAndUpdate(brandId, { discount: highestDiscount });

  } catch (err) {
    console.error("Failed to update brand discount:", err.message);
  }
};


// Get all brands
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a brand
export const addBrand = async (req, res) => {
  try {
    const { name, category, description } = req.body;

    if (!name || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Name and category are required" });
    }

    let logoUrl = "";
    let featuredUrl = "";

    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        const resultLogo = await uploadToCloudinary(
          req.files.logo[0].buffer,
          "brands"
        );
        logoUrl = resultLogo.secure_url;
      }

      if (req.files.featuredImage && req.files.featuredImage[0]) {
        const resultFeatured = await uploadToCloudinary(
          req.files.featuredImage[0].buffer,
          "brands/featured"
        );
        featuredUrl = resultFeatured.secure_url;
      }
    }

    const brand = await Brand.create({
      name,
      category,
      description,
      logo: logoUrl,
      featuredImage: featuredUrl,
    });

    res.status(201).json({ success: true, brand });
  } catch (err) {
    console.error("Create Brand Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update a brand
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });

    const { name, category, description, isFeatured } = req.body;

    if (name) brand.name = name;
    if (category) brand.category = category;
    if (description) brand.description = description;
    if (isFeatured !== undefined) brand.isFeatured = isFeatured === "true" || isFeatured === true;

    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        if (brand.logo) await deleteCloudinaryImage(brand.logo);
        const resultLogo = await uploadToCloudinary(
          req.files.logo[0].buffer,
          "brands"
        );
        brand.logo = resultLogo.secure_url;
      }

      if (req.files.featuredImage && req.files.featuredImage[0]) {
        if (brand.featuredImage)
          await deleteCloudinaryImage(brand.featuredImage);
        const resultFeatured = await uploadToCloudinary(
          req.files.featuredImage[0].buffer,
          "brands/featured"
        );
        brand.featuredImage = resultFeatured.secure_url;
      }
    }

    const updatedBrand = await brand.save();
    res.json({ success: true, brand: updatedBrand });
  } catch (err) {
    console.error("Update Brand Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// Delete a brand
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });

    if (brand.logo) await deleteCloudinaryImage(brand.logo);
    if (brand.featuredImage) await deleteCloudinaryImage(brand.featuredImage);

    await brand.deleteOne();
    res.json({ success: true, message: "Brand deleted successfully" });
  } catch (err) {
    console.error("Delete Brand Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get brand by ID
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    res.json({ success: true, brand });
  } catch (err) {
    console.error("Get Brand Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Set brand as featured / update featured image & discount
export const setBrandFeatured = async (req, res) => {
  try {
    const { brandId, isFeatured, discount } = req.body;

    const brand = await Brand.findById(brandId);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });

    brand.isFeatured = isFeatured ?? brand.isFeatured;
    if (discount !== undefined) brand.discount = discount;

    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      if (brand.featuredImage) await deleteCloudinaryImage(brand.featuredImage);
      const result = await uploadToCloudinary(
        req.files.featuredImage[0].buffer,
        "brands/featured"
      );
      brand.featuredImage = result.secure_url;
    }

    await brand.save();
    res.json({ success: true, brand });
  } catch (err) {
    console.error("Set Brand Featured Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get only featured brands for slider
export const getFeaturedBrands = async (req, res) => {
  try {
    const featuredBrands = await Brand.find({ isFeatured: true })
      .sort({ discount: -1 })
      .limit(10);
    res.json({ success: true, featuredBrands });
  } catch (err) {
    console.error("Get Featured Brands Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
