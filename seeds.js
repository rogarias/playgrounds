var mongoose    = require("mongoose"),
    Playground  = require("./models/playground"),
    Comment     = require("./models/comment");

var data = [
    {
        name: "Cloud's Rest",
        image: "https://images.unsplash.com/photo-1484960055659-a39d25adcb3c?auto=format&fit=crop&w=750&q=80&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer a mollis enim. Nullam blandit, est sit amet ornare tristique, sapien mauris condimentum arcu, et posuere leo lacus ac urna. Etiam malesuada est est, vitae placerat massa porta ut. Mauris volutpat vel metus et efficitur."
    },
    {
        name: "High Mountain",
        image: "https://images.unsplash.com/photo-1487730116645-74489c95b41b?auto=format&fit=crop&w=750&q=80&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer a mollis enim. Nullam blandit, est sit amet ornare tristique, sapien mauris condimentum arcu, et posuere leo lacus ac urna. Etiam malesuada est est, vitae placerat massa porta ut. Mauris volutpat vel metus et efficitur."
    },
    {
        name: "Sun's Paradise",
        image: "https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=750&q=80&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer a mollis enim. Nullam blandit, est sit amet ornare tristique, sapien mauris condimentum arcu, et posuere leo lacus ac urna. Etiam malesuada est est, vitae placerat massa porta ut. Mauris volutpat vel metus et efficitur."
    },
    {
        name: "Morning Joy",
        image: "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=751&q=80&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer a mollis enim. Nullam blandit, est sit amet ornare tristique, sapien mauris condimentum arcu, et posuere leo lacus ac urna. Etiam malesuada est est, vitae placerat massa porta ut. Mauris volutpat vel metus et efficitur."
    },
];


function seedDB(){
    //REMOVE ALL PLAYGROUNDS
    Playground.remove({}, function(err){
        if(err) {
            console.log(err);
        }
        console.log("Removed Playgrounds");
        //CREATE NEW Playgrounds
        data.forEach(function(seed){
            Playground.create(seed, function(err, playground) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("Added a playground");
                    //Creat a comment
                    Comment.create(
                        {
                            text: "This place was great, but I wish there was internet.",
                            author: "Homer"
                        },  function(err, comment){
                                if(err) {
                                    console.log(err);
                                } else {
                                    playground.comments.push(comment);
                                    playground.save();
                                    console.log("Added a comment");
                                }
                    });
                }
            });
        });
    });
}

module.exports = seedDB;