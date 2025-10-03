import mongoose, { Types } from "mongoose";
import User from "../models/User";
import Plan from "../models/Plan";
import Task from "../models/Task";

// Migration script to convert from old plan_roles system to new Plan model
export const migrateToPlans = async () => {
  try {
    console.log("Starting migration to Plan model...");

    // Find all users with plan_roles
    const usersWithPlans = await User.find({
      plan_roles: { $exists: true, $ne: null }
    });

    console.log(`Found ${usersWithPlans.length} users with plan roles`);

    for (const user of usersWithPlans) {
      if (user.plan_roles && user.plan_roles.size > 0) {
        for (const [planName, role] of user.plan_roles.entries()) {
          // Create or find plan
          let plan = await Plan.findOne({ name: planName });
          
          if (!plan) {
            // Create new plan
            plan = new Plan({
              name: planName,
              description: `Migrated plan: ${planName}`,
              owner_id: role === 'owner' ? new Types.ObjectId(user._id) : new Types.ObjectId(), // Temporary owner
              members: []
            });
            await plan.save();
            console.log(`Created plan: ${planName}`);
          }

          // Add user to plan
          if (role === 'owner') {
            plan.owner_id = new Types.ObjectId(user._id);
            await plan.save();
          } else {
            // Check if user is already a member
            const existingMember = plan.members.find(m => m.user_id.toString() === user._id.toString());
            if (!existingMember) {
              plan.members.push({
                user_id: new Types.ObjectId(user._id),
                role: role as "editor" | "viewer",
                joined_at: new Date()
              });
              await plan.save();
            }
          }
        }
      }
    }

    // Update tasks to reference Plan ObjectId instead of string plan_id
    const tasks = await Task.find({});
    console.log(`Found ${tasks.length} tasks to migrate`);

    for (const task of tasks) {
      if (typeof task.plan_id === 'string') {
        const plan = await Plan.findOne({ name: task.plan_id });
        if (plan) {
          task.plan_id = new Types.ObjectId(plan._id);
          await task.save();
          console.log(`Updated task ${task._id} to reference plan ${plan._id}`);
        }
      }
    }

    // Remove plan_roles from User model (optional - for clean migration)
    // await User.updateMany({}, { $unset: { plan_roles: 1 } });

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  require('dotenv').config();
  
  mongoose.connect(process.env.MONGODB_URI!)
    .then(() => {
      console.log("Connected to MongoDB");
      return migrateToPlans();
    })
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
