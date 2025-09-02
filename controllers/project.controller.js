import Project from "../models/project.model.js";
import createError from "../utils/createError.js";

export const createProject = async (req, res, next) => {
  if (req.isSeller)
    return next(createError(403, "Only clients can create a Project!"));
  let existedProject = await Project.findOne({title:req.body.title});
  if(existedProject) return next(createError(403, "you can not add existing Project"));
  const newProject = new Project({
    userId: req.userId,
    ...req.body,
  });

  try {
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (err) {
    next(err);
  }
};
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
  
    if(!project){
      return next(createError(404, "Project Not found  !"));
    }
    if (project.userId !== req.userId)
      return next(createError(403, "You can delete only your Project!"));

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).send("Project has been deleted!");
  } catch (err) {
    next(err);
  }
};
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) next(createError(404, "Project not found!"));
    res.status(200).send(project);
  } catch (err) {
    next(err);
  }
};
export const getProjects = async (req, res, next) => {
  const q = req.query; // to get filtering elemnet from url params 
  const filters = {  // filters object was built dynamicaly due to params 
    ...(q.userId && { userId: q.userId }),
    ...(q.cat && { cat: q.cat }),
    ...((q.min || q.max) && {
      price: {
        ...(q.min && { $gt: q.min }),
        ...(q.max && { $lt: q.max }),
      },
    }),
    ...(q.search && { title: { $regex: q.search, $options: "i" } }),
  };
  try {
    const projects = await Project.find(filters).sort({ [q.sort]: -1 }); // sort come from query to sort results based on price or created at
    if(projects) res.status(200).send(projects);
    else res.status(100).send("there is no projects")
  } catch (err) {
    next(err);
  }
};
export const contractProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return next(createError(404, "Project not found!"));
    }

    // المشروع لازم يكون مفتوح للتعاقد
    if (project.status === "closed") {
      return next(createError(400, "This project is already contracted!"));
    }

    // صاحب المشروع فقط اللي يقدر يختار متعاقد
    if (project.userId !== req.userId) {
      return next(createError(403, "You can only contract your own projects!"));
    }

    // إضافة المتعاقد و إغلاق المشروع
    project.contractorId = req.body.contractorId;
    project.status = "closed";

    const updatedProject = await project.save();
    res.status(200).json({
      message: "Project contracted successfully!",
      project: updatedProject,
    });
  } catch (err) {
    next(err);
  }
};
