import express from 'express';
import connectDatabase from './config/db';
import {check, validationResult} from 'express-validator';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import User from './config/models/User';
import Post from './config/models/Post';
import jwt from "jsonwebtoken";
import config from "config";
import auth from './middleware/auth';

// Initialize express application
const app = express();

// Connect Database
connectDatabase();

// Configure Middleware
app.use(express.json({extended: false}));
app.use(cors({origin: "http://localhost:3000"}));

// API endpoints
/**
 * @route GET /
 * @desc Test endpoint
 */
app.get('/', (req, res) =>
    res.send('http get request sent to root api endpoint')
);

/**
 * @route POST api/users
 * @desc Register User
 */
app.post(
  '/api/users',
  [
    check('name', 'Please enter your name').not().isEmpty(),
    check('email', 'Please enter valid email').isEmail(),
    check(
      'password',
      'Please enter password of at least 6 characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({errors: errors.array()});
    }else{
      try{
        const {name, email, password} = req.body;
        console.log(password);
        let user = await User.findOne({email: email});

        if(user){
          return res.status(400).json({errors:[{msg: "User already exixts"}]});
        }

        // Create new user
        user = new User({
          name: name,
          email: email,
          password: password
        });

        // Encrypt the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        
        returnToken(user, res);

      }catch(error){
        console.log(error);
        res.status(500).send("Server error");
      }
        
    }
  }
);

/**
 * @route GET api/auth
 * @desc Authenticate User
 */

app.get('/api/auth', auth, async (req, res) =>{
  try{
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
  }catch(error){
    res.status(500).send('Unknown server error');
  }
});

/**
 * @route POST api/login
 * @desc Login User
 */
app.post(
  '/api/login',
  [
    check('email', 'Please enter valid email').isEmail(),
    check('password','Please enter password').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({errors: errors.array()});
    }else{
      const {email, password} = req.body;
      try{
          let user = await User.findOne({email: email});

          if(!user){
            return res.status(400).json({errors:[{msg: "invalid email or password"}]});
          }

          const match = await bcrypt.compare(password, user.password);

          if(!match){
            return res
            .status(400)
            .json({errors: [{ msg: 'Invalid email or password'}]});
          }


          // Generate and return a JWT token
          returnToken(user, res);

        }catch(error){
        console.log(error);
        res.status(500).send("Server error");
      }
        
    }
  }
);

const returnToken = (user, res) =>{
  const payload = {
          user:{
            id: user.id
          }
        };

        jwt.sign(
          payload,
          config.get('jwtSecret'),
          {expiresIn: '10h'},
          (err, token)=>{
            if(err) throw err;
            res.json({token: token});
          }
        );
};

/**
 * @route POST api/posts
 * @desc Create post
 */
app.post(
  '/api/posts',
  [
    auth,
    [
      check('title','Title text is required').not().isEmpty(),
      check('body', 'Body text is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      res.status(400).json({errors: errors.array()});
    }else{
      const {title, body} = req.body;
      try{
        // get user who created post
        const user = await User.findById(req.user.id);

        // Create new post
        const post = new Post({
          user:user.id,
          title: title,
          body: body
        });

        await post.save();

        res.json(post);
      }catch(error){
        console.error(error);
        res.status(500).send('Server error')
      }
    }
  }
);

/**
 * @route GET api/posts
 * @desc Get Posts
 */
app.get('/api/posts', auth, async (req, res)=>{
  try{
    const posts = await Post.find().sort({date: -1});

    res.json(posts);
  }catch(error){
    console.error(error);
    res.status(500).send('Server error');
  }

});

/**
 * @route GET api/posts/:id
 * @desc Get Post
 */
app.get('/api/posts/:id', auth, async (req, res)=>{
  try{
    const post = await Post.findById(req.params.id);

    if(!post){
      return res.status(404).json({msg: 'Post not found'});
    }

    res.json(post);
  }catch(error){
    console.error(error);
    res.status(500).send('Server error');
  }

});

/**
 * @route DELETE api/posts/:id
 * @desc Delete post
 */

app.delete('/api/posts/:id', auth, async (req, res)=> {
  try {
    const post = await Post.findById(req.params.id);
    if(!post){
      return res.status(404).json({msg: 'Post not found'});
    }
    if (post.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'User not authorized'});
    }

    await post.remove();

    res.json({msg: 'Post removed'})
  }catch (error){
    console.error(error);
    res.status(500).send('Server error')
  }
});

/**
 * @route PUT api/posts/:id
 * @desc Update post
 */

app.put('/api/posts/:id', auth, async (req,res)=>{
  try{
    const {title, body} = req.body;
    const post = await Post.findById(req.params.id);

    // Make sure the post was found
    if (!post){
      return res.status(404).json({mesg: 'Post not found'});
    }
    if (post.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'User not authorized'});
    }

    post.title = title || post.title;
    post.body = body || post.body;

    await post.save();

    res.json(post);
  }catch(error){
    console.error(error);
    res.status(500).send('Server error');
  }
})

app.get

// Connection listener
const port = 5000;
app.listen(port, () => console.log(`Express server running on port ${port}`)); 