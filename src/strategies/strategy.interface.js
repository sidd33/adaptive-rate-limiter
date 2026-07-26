class RateLimitStrategy{
    constructor(redisClient, config){
        if(new.target == RateLimitStrategy){
            throw new error("RateLimitStrategy is abstract and cannoy be instamtiated.");
        }

        this.redis = redisClient;
        this.config = config;
    }

    async check(key){
        throw new error("check() must be implemented by the subclass");
    }
}

module.exports = RateLimitStrategy;