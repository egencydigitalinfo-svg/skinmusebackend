import Order from "../models/Orders.js";
import Product from "../models/Products.js";
import sendEmail from "../../sendEmail.js";
import dotenv from "dotenv";
import upload from "../middlewares/upload.js";
import cloudinary from "../config/cloudinary.js";

dotenv.config();

/** -------------------------------
 *  Save new order (with screenshot)
 *  POST /api/orders
 * ------------------------------*/
export const createOrder = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      address,
      city,
      zipCode,
      method,
      totalPrice,
      promoCode,
      discount,
      phone,
      province,
      additionalNotes,
      items,
    } = req.body;

    // items may come as JSON string when using FormData
    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;

    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 🖼 Upload screenshot to Cloudinary if method is not COD
    let paymentScreenshotUrl = null;
    if (req.file && method !== "cod") {
      const uploaded = await cloudinary.uploader.upload_stream(
        { folder: "skinmuse/orders" },
        (error, result) => {
          if (error) throw error;
          return result.secure_url;
        }
      );

      // Since cloudinary.uploader.upload_stream requires a stream:
      await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "skinmuse/orders" },
          (error, result) => {
            if (error) reject(error);
            else {
              paymentScreenshotUrl = result.secure_url;
              resolve();
            }
          }
        );
        stream.end(req.file.buffer);
      });
    }

    // Create order document
    const order = new Order({
      email,
      firstName,
      lastName,
      address,
      city,
      zipCode,
      method,
      totalPrice,
      promoCode,
      phone,
      province,
      additionalNotes: additionalNotes ? additionalNotes : "",
      discount,
      paymentScreenshot: paymentScreenshotUrl || null,
      items: parsedItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        selectedColor: i.selectedColor || null,
        selectedLitre: i.selectedLitre || null,
        price: i.price,
      })),
      status: method === "cod" ? "pending" : "awaiting_verification",
    });

    const savedOrder = await order.save();

    for (const item of parsedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      let stockReduced = false;

      // Reduce color variant stock
      if (item.selectedColor && Array.isArray(product.colors)) {
        const colorObj = product.colors.find(
          (c) => c.hex === item.selectedColor || c.name === item.selectedColor
        );
        if (colorObj) {
          colorObj.stock = Math.max(0, (colorObj.stock || 0) - item.quantity);
          stockReduced = true;
        }
      }

      // Reduce litre variant stock
      if (item.selectedLitre && Array.isArray(product.litres)) {
        const litreObj = product.litres.find(
          (l) => l.amount === item.selectedLitre
        );
        if (litreObj) {
          litreObj.stock = Math.max(0, (litreObj.stock || 0) - item.quantity);
          stockReduced = true;
        }
      }

      // If no variant used, reduce main stock
      if (!stockReduced) {
        product.stock = Math.max(0, (product.stock || 0) - item.quantity);
      } else {
        // Recalculate total stock for variants
        const totalColorStock =
          product.colors?.reduce((sum, c) => sum + (c.stock || 0), 0) || 0;
        const totalLitreStock =
          product.litres?.reduce((sum, l) => sum + (l.stock || 0), 0) || 0;
        product.stock = totalColorStock + totalLitreStock;
      }

      product.salesCount = (product.salesCount || 0) + item.quantity;
      await product.save();
    }

    const orderItemsHtml = await Promise.all(
      parsedItems.map(async (item) => {
        const product = await Product.findById(item.productId);

        // fallback if product is deleted
        const productName = product ? product.name : "Unknown Product";
        const productImage = product ? product.images?.[0] : ""; // assuming 'images' is an array of URLs

        return `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">
        ${
          productImage
            ? `<img src="${productImage}" width="50" style="border-radius:4px;margin-right:8px;vertical-align:middle;">`
            : ""
        }
        ${productName}
      </td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${
        item.quantity
      }</td>
     <td style="padding:8px;border:1px solid #ddd;text-align:center;">${
       item.selectedColor || item.selectedLitre || "N/A"
     }</td>

      <td style="padding:8px;border:1px solid #ddd;text-align:right;">Rs ${
        item.price
      }</td>
    </tr>
  `;
      })
    );

    const customerHtml = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#E91E63;color:#ffffff;padding:20px;text-align:center;font-size:24px;font-weight:bold;">
            SKIN MUSE
          </td>
        </tr>
        <tr>
          <td style="padding:20px;color:#333333;">
            <h2 style="color:#E91E63;">Thank you for your order, ${firstName}!</h2>
            <p>We have received your order and it is being processed. Below are your order details:</p>
            <p><strong>Order ID:</strong> ${savedOrder._id}</p>
            <p><strong>Total Price:</strong> Rs ${totalPrice}</p>
            <h3>Items:</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#f2f2f2;">
                  <th style="padding:10px;border:1px solid #ddd;text-align:left;">Product ID</th>
                  <th style="padding:10px;border:1px solid #ddd;text-align:center;">Qty</th>
                  <th style="padding:10px;border:1px solid #ddd;text-align:center;">Color</th>
                  <th style="padding:10px;border:1px solid #ddd;text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>
            <p style="margin-top:20px;">We will notify you once your order is shipped.</p>
            <p>For any queries, reply to this email or contact our support team.</p>
            <p style="margin-top:40px;">Regards,<br><strong>SKIN MUSE</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background:#f2f2f2;color:#555555;padding:10px;text-align:center;font-size:12px;">
            © ${new Date().getFullYear()} SKIN MUSE. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

    const adminHtml = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#E91E63;color:#ffffff;padding:20px;text-align:center;font-size:24px;font-weight:bold;">
            New Order Received
          </td>
        </tr>
        <tr>
          <td style="padding:20px;color:#333333;">
            <p><strong>Order ID:</strong> ${savedOrder._id}</p>
            <p><strong>Customer Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Address:</strong> ${address}, ${city}, ${province}, ${zipCode}</p>
            <p><strong>Payment Method:</strong> ${method}</p>
            ${additionalNotes?`<p><strong>Additional Notes:</strong> ${additionalNotes}</p>`:""}
            <p><strong>Total Price:</strong> Rs ${totalPrice}</p>
            ${
              paymentScreenshotUrl
                ? `<p><strong>Payment Screenshot:</strong> <a href="${paymentScreenshotUrl}" target="_blank">View Screenshot</a></p>`
                : ""
            }
            <h3>Items:</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#f2f2f2;">
                  <th style="padding:10px;border:1px solid #ddd;text-align:left;">Product ID</th>
                  <th style="padding:10px;border:1px solid #ddd;text-align:center;">Qty</th>
                  <th style="padding:10px;border:1px solid #ddd;text-align:center;">Color</th>
                  <th style="padding:10px;border:1px solid #ddd;text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>
            <p style="margin-top:20px;">Please process this order promptly.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f2f2f2;color:#555555;padding:10px;text-align:center;font-size:12px;">
            © ${new Date().getFullYear()} SKIN MUSE. Admin Notification.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

    // Customer gets confirmation
    await sendEmail({
      to: email, // customer email
      subject: `Your Order Confirmation - ${savedOrder._id}`,
      html: customerHtml,
      replyTo: "sales@skinmuse.pk", // so replies go to your sales mailbox
    });

    // Admin gets notification
    await sendEmail({
      to: process.env.ADMIN_EMAIL, // sales@skinmuse.pk
      subject: `New Order Received - ${savedOrder._id}`,
      html: adminHtml,
    });

    res
      .status(201)
      .json({ message: "Order placed successfully", order: savedOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: error.message });
  }
};

/** -------------------------------
 *  Get all orders (Admin)
 *  GET /api/orders
 * ------------------------------*/

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** -------------------------------
 *  Get single order by ID
 *  GET /api/orders/:id
 * ------------------------------*/
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.productId"
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** -------------------------------
 *  Update order status (Admin)
 *  PUT /api/orders/:id
 * ------------------------------*/
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    const updatedOrder = await order.save();

    res.json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** -------------------------------
 *  Delete order (Admin)
 *  DELETE /api/orders/:id
 * ------------------------------*/
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await Order.findByIdAndDelete(req.params.id);

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
