import Blog from "../models/Blog.js";
import cloudinary from "../config/cloudinary.js";

// Create Blog with Cloudinary Image Upload
export const createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, author, date, category } = req.body;

    let imageUrl = "";
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "blogs" },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    const blog = await Blog.create({
      title,
      excerpt,
      content,
      author,
      date,
      category,
      image: imageUrl,
    });

    res.status(201).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get All Blogs
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    res.json({ success: true, blogs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Blog by ID
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, error: "Blog not found" });
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Update blog (with optional new image)
export const updateBlog = async (req, res) => {
  try {
    const { title, excerpt, content, author, category } = req.body;

    const parsedCategories = Array.isArray(category)
      ? category
      : JSON.parse(category || "[]");

    let updateData = {
      title,
      excerpt,
      content,
      author,
      category: parsedCategories,
    };

    // If new image uploaded
    if (req.file) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "blogs" },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      updateData.image = uploaded.secure_url;
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!blog)
      return res.status(404).json({ success: false, error: "Blog not found" });
    res.status(200).json({ success: true, blog });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog)
      return res.status(404).json({ success: false, error: "Blog not found" });
    res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
