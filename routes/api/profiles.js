const express = require('express');
const router = express.Router();
const config = require('config');
const multer = require('multer');
const fs = require ('fs');
var path = require('path');
const mongoose = require('mongoose')
//const request = require('request');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/profile');
const User = require('../../models/User');

/* start upload image logic */
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder_id = req.user.id;
    dirPath = `./static/images/${folder_id}`;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
    cb(null, dirPath);
  },
  filename: function (req, file, cb) {
    const nickname = req.user.nickname;
    cb(null, Date.now() + file.originalname );
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

var uploadCover = multer({ storage: storage, fileFilter: fileFilter }).single("image");
var uploadGallery = multer({ storage: storage }).array("photos", 10);

/* end upload image logic */

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  '/',  
  auth,
  [
    check('gender', 'Gender is required')
      .not()
      .isEmpty(),
    check('sexual_orientation', 'Sexual orientation is required')
      .not()
      .isEmpty(),
    check('type', 'Account type is required')
      .not()
      .isEmpty(),
    check('country', 'Country is required')
      .not()
      .isEmpty(),
    check('canton', 'Canton is required')
      .not()
      .isEmpty(),
    check('city', 'City is required')
      .not()
      .isEmpty(),
    check('ZIP', 'ZIP is required')
      .not()
      .isEmpty(),
    check('subscription_plan', 'Subscription plan is required')
      .not()
      .isEmpty(),
    check('Languages', 'Spoken languages are required')
      .not()
      .isEmpty(),
    check('category', 'Category is required')
      .not()
      .isEmpty(),
    check('services', 'Services are required')
      .not()
      .isEmpty(),
    check('age', 'Age is required')
      .not()
      .isEmpty(),
    check('silhouette', 'Category is required')
      .not()
      .isEmpty(),
    check('origin', 'Origin is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      gender,
      sexual_orientation,
      phone,
      type,
      country,
      canton,
      city,
      ZIP,
      subscription_plan,
      start_of_subscription,
      end_of_subscription,
      favorites, // array
      is_active,
      languages, // array
      slogan,
      category,
      services, // array
      age,
      silhouette,
      origin,
      description,
      cover_photo, // photo
      photos,
      hours,
      rate,
      website,
      ratings, // array
      opinions,
    } = req.body;

    /* Profile Object */
    const profileFields = {};
    profileFields.user = req.user.id;
    if (gender) profileFields.gender = gender;
    if (sexual_orientation)
      profileFields.sexual_orientation = sexual_orientation;
    if (phone) profileFields.phone = phone;
    if (type) profileFields.type = type;
    if (country) profileFields.country = country;
    if (canton) profileFields.canton = canton;
    if (city) profileFields.city = city;
    if (ZIP) profileFields.ZIP = ZIP;
    if (subscription_plan) profileFields.subscription_plan = subscription_plan;
    if (start_of_subscription)
      profileFields.start_of_subscription = start_of_subscription;
    if (end_of_subscription)
      profileFields.end_of_subscription = end_of_subscription;
    if (is_active) profileFields.is_active = is_active;
    if (slogan) profileFields.slogan = slogan;
    if (category) profileFields.category = category;
    if (age) profileFields.age = age;
    if (silhouette) profileFields.silhouette = silhouette;
    if (origin) profileFields.origin = origin;
    if (description) profileFields.description = description;
    if (hours) profileFields.hours = hours;
    if (rate) profileFields.rate = rate;
    if (website) profileFields.website = website;

    //photo
    if (cover_photo) profileFields.cover_photo = cover_photo;

    // Array items
    if (photos) {
      profileFields.photos = photos
        .split(',')
        .map(photo => photo.trim());
    }
    if (opinions) {
      profileFields.opinions = opinions
        .split(',')
        .map(opinion => opinion.trim());
    }
    if (favorites) {
      profileFields.favorites = favorites
        .split(',')
        .map(favorite => favorite.trim());
    }
    if (languages) {
      profileFields.languages = languages
        .split(',')
        .map(language => language.trim());
    }
    if (services) {
      profileFields.services = services
        .split(',')
        .map(service => service.trim());
    }
    if (ratings) {
      profileFields.ratings = ratings.split(',').map(rating => rating.trim());
    }

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      //Create
      profile = new Profile(profileFields);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['nickname']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['nickname']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found!' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found!' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['nickname']
    );

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
router.delete('/', auth, async (req, res) => {
  try {
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove User
    // await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User Deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// TODO: upload photo gallery and upload cover photo and check ovo ispod

// @route    POST api/profile/upload-cover
// @desc     Upload cover photo
// @access   Private
router.post(
  "/upload-cover",
  auth,
  async (req, res) => {
    try {
        uploadCover(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          return res.status(500).json(err);
        } else if (err) {
          return res.status(500).json(err);
        }
        var file = req.file;
        const coverUrl =
          path.join(file.destination, file.filename);
        const profile = await Profile.findOne({
          user: mongoose.Types.ObjectId(req.user._id)
        });
        if (profile) {
          const coverUrl = profile.coverUrl;
          fs.unlink(coverUrl, err => { console.log("error", err) });
        }
        await Profile.findOneAndUpdate(
          { user: req.user.id },
          {
            cover_photo: coverUrl
          },
          {
            new: true,
            upsert: true
          }
        );
        return res.status(200).json({ cover_photo: coverUrl });
      });
    } catch (err) {
      console.log("create dish err:", err);
      return res.status(500).json();
    }
  }
);


// @route    POST api/profile/upload-gallery
// @desc     Upload gallery photos 
// @access   Private
router.post(
  "/upload-gallery",
  auth,
  async (req, res) => {
    try {
        uploadGallery(req, res, async function (err) {
          if (err instanceof multer.MulterError) {
            return res.status(500).json(err);
          } else if (err) {
            return res.status(500).json(err);
          }
          const photoUrls = req.files.map((item, index) => {
            return path.join(item.destination,item.filename);
          });
          // const exist_images = req.body.exist_images;
          // if (exist_images && exist_images.length > 0 && exist_images[0] != "") {
          //   exist_images.map(item => {
          //     photoUrls.unshift(item);
          //   });
          // }
         
          
          const profile = await Profile.findOne({
            user: mongoose.Types.ObjectId(req.user._id)
        });
        if (profile) {
          const photoUrls = profile.photoUrls;
          fs.unlink(photoUrls, err => { console.log("error", err) });
        }
        const photo = await Profile.findOne({
          user: req.user.id
        });
        if (photo) {
          photo.photos.map((item, index) => {
            const imgPath = path.join(item.destination,item);
            fs.unlink(imgPath, err => {});
          });
        }
        var photos = await Profile.findOneAndUpdate(
          {
            user: req.user.id
          },
          {
            user: req.user.id,
            photos: photoUrls
          },
          {
            new: true,
            upsert: true
          }
        );
        await Profile.findOneAndUpdate(
          {
            user: req.user.id
          },
          {
            photos: photoUrls
          },
          {
            new: true,
            upsert: true
          }
        );
      });
      console.log("gallery uploaded")
        return res.status(200).json();
      } catch (err) {
        console.log("gallery upload err:", err);
      }
      return res.status(500).json();
    }
  );

 
// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.post(
  '/opinions',
  [
    auth,
    [
      check('review', 'Review is required')
        .not()
        .isEmpty(),
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('name', 'Name is required')
        .not()
        .isEmpty(),
      check('email', 'Please include a valid email')
      .isEmail(),
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      review,
      title,
      name,
      email
    } = req.body;

    const newOpinion = {
      review,
      title,
      name,
      email
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.opinions.unshift(newOpinion);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
