import { Contact } from "@/app/models/Contact";
import { Tag } from "@/app/models/Tag";
import mongoose from "mongoose";

export interface ICreateContactInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags?: string[]; // Tag IDs
  notes?: string;
  createdBy: string; // User ID
}

export interface IUpdateContactInput extends Partial<ICreateContactInput> {
  id: string;
}

export interface IPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
}

export class ContactService {
  /**
   * Get paginated list of contacts with search, filter, and full-text search
   */
  async getContacts(userId: string, params: IPaginationParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { createdBy: new mongoose.Types.ObjectId(userId) };

    // Add tag filter
    if (params.tags && params.tags.length > 0) {
      filter.tags = {
        $in: params.tags.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    // Handle search (text search + fallback to regex)
    if (params.search) {
      const searchRegex = new RegExp(params.search, "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
      ];
    }

    // Execute paginated query with population
    const contacts = await Contact.find(filter)
      .populate("tags", "name color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Contact.countDocuments(filter);

    return {
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single contact by ID
   */
  async getContactById(contactId: string, userId: string) {
    const contact = await Contact.findOne({
      _id: contactId,
      createdBy: userId,
    })
      .populate("tags", "name color")
      .populate("createdBy", "displayName email photoURL");

    if (!contact) {
      throw new Error("Contact not found");
    }

    return contact;
  }

  /**
   * Create a new contact
   */
  async createContact(data: ICreateContactInput) {
    // Check for existing email
    const existing = await Contact.findOne({
      email: data.email.toLowerCase(),
      createdBy: data.createdBy,
    });

    if (existing) {
      throw new Error("A contact with this email already exists");
    }

    // Validate tag IDs belong to the user
    if (data.tags && data.tags.length > 0) {
      const tagDocs = await Tag.find({
        _id: { $in: data.tags },
        createdBy: data.createdBy,
      });

      if (tagDocs.length !== data.tags.length) {
        throw new Error("Some tags do not belong to your account");
      }
    }

    const contact = new Contact({
      ...data,
      email: data.email.toLowerCase(),
      createdBy: data.createdBy,
    });

    await contact.save();
    await contact.populate("tags", "name color");

    return contact;
  }

  /**
   * Update a contact
   */
  async updateContact(data: IUpdateContactInput) {
    const { id, createdBy, ...updateData } = data;

    if (!id || !createdBy) {
      throw new Error("Contact ID and User ID are required");
    }

    // Validate ownership and existence
    const contact = await Contact.findOne({
      _id: id,
      createdBy,
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existing = await Contact.findOne({
        email: updateData.email.toLowerCase(),
        createdBy,
        _id: { $ne: id },
      });

      if (existing) {
        throw new Error("A contact with this email already exists");
      }

      updateData.email = updateData.email.toLowerCase();
    }

    // Validate tags if provided
    if (updateData.tags && updateData.tags.length > 0) {
      const tagDocs = await Tag.find({
        _id: { $in: updateData.tags },
        createdBy,
      });

      if (tagDocs.length !== updateData.tags.length) {
        throw new Error("Some tags do not belong to your account");
      }
    }

    const updated = await Contact.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("tags", "name color");

    return updated;
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string, userId: string) {
    const result = await Contact.findOneAndDelete({
      _id: contactId,
      createdBy: userId,
    });

    if (!result) {
      throw new Error("Contact not found");
    }

    return result;
  }

  /**
   * Bulk import contacts from CSV
   * Returns { successCount, failedCount, errors[] }
   */
  async bulkImportContacts(
    contacts: Partial<ICreateContactInput>[],
    userId: string
  ) {
    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [] as Array<{ rowIndex: number; email: string; error: string }>,
    };

    // Get all existing emails for this user (for duplicate detection)
    const existingEmails = new Set(
      (
        await Contact.find({ createdBy: userId }, { email: 1 }).lean()
      ).map((c) => c.email.toLowerCase())
    );

    // Validate tags
    const validTags =
      contacts.length > 0
        ? await Tag.find({
            _id: { $in: [] },
            createdBy: userId,
          })
        : [];
    const validTagIds = new Set(validTags.map((t) => t._id.toString()));

    for (let i = 0; i < contacts.length; i++) {
      try {
        const contact = contacts[i];

        // Validate required fields
        if (!contact.name || !contact.name.trim()) {
          throw new Error("Name is required");
        }

        if (!contact.email || !contact.email.trim()) {
          throw new Error("Email is required");
        }

        const normalizedEmail = contact.email.toLowerCase().trim();

        // Check for duplicates within import and existing
        if (existingEmails.has(normalizedEmail)) {
          throw new Error("Email already exists");
        }

        // Validate tags
        const contactTags = contact.tags || [];
        if (
          contactTags.length > 0 &&
          !contactTags.every((t) => validTagIds.has(t))
        ) {
          throw new Error("Invalid tag ID");
        }

        // Create contact
        const newContact = await Contact.create({
          name: contact.name.trim(),
          email: normalizedEmail,
          phone: contact.phone?.trim() || "",
          company: contact.company?.trim() || "",
          tags: contact.tags || [],
          notes: contact.notes?.trim() || "",
          createdBy: userId,
        });

        existingEmails.add(normalizedEmail);
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({
          rowIndex: i + 1,
          email: contacts[i].email || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Bulk delete contacts
   */
  async bulkDeleteContacts(contactIds: string[], userId: string) {
    if (!contactIds || contactIds.length === 0) {
      throw new Error("No contact IDs provided");
    }

    const result = await Contact.deleteMany({
      _id: { $in: contactIds },
      createdBy: userId,
    });

    return {
      deletedCount: result.deletedCount,
    };
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(userId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalContacts, newThisWeek, tagStats] = await Promise.all([
      Contact.countDocuments({ createdBy: userId }),
      Contact.countDocuments({
        createdBy: userId,
        createdAt: { $gte: weekAgo },
      }),
      this.getTagDistribution(userId),
    ]);

    return {
      totalContacts,
      newThisWeek,
      tagStats,
    };
  }

  /**
   * Get contacts grouped by company
   */
  async getContactsByCompany(userId: string) {
    const result = await Contact.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return result.map((item) => ({
      company: item._id || "Unspecified",
      count: item.count,
    }));
  }

  /**
   * Get tag distribution
   */
  async getTagDistribution(userId: string) {
    const result = await Contact.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: "tags",
          localField: "_id",
          foreignField: "_id",
          as: "tag",
        },
      },
      { $unwind: "$tag" },
      {
        $project: {
          _id: 1,
          tagName: "$tag.name",
          tagColor: "$tag.color",
          count: 1,
        },
      },
    ]);

    return result;
  }

  /**
   * Get contacts timeline (grouped by date)
   */
  async getContactsTimeline(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await Contact.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((item) => ({
      date: item._id,
      contacts: item.count,
    }));
  }
}

// Export singleton instance
export const contactService = new ContactService();
