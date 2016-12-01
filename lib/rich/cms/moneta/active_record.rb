begin
  require "active_record"
rescue LoadError
  puts "You need the activerecord gem in order to use the ActiveRecord moneta store"
  exit
end

module Moneta
  class ActiveRecord
    
    def initialize(options = {})
      @store = new_store({:key => :key, :value => :value}.merge(options))
    end

    def [](key)
      @store.find(key).try :value
    end

    def []=(key, value)
      puts "=====>"
      puts key
      entry = @store.find_or_initialize(key)
      entry.value = value
      entry.save!
    end

    def delete(key)
      if entry = @store.find(key)
        entry.destroy
        entry.value
      end
    end

    def key?(key)
      !!self[key]
    end
    alias :has_key? :key?

    def store(key, value, options = {})
      self[key] = value # as you only pass options[:expires_at] the options argument is ignored
    end

    def update_key(key, options)
      # not implemented
    end

    def clear
      @store.delete_all
    end

  private

    def new_store(options)
      Class.new(::ActiveRecord::Base) do
        class_eval <<-CODE
          attr_accessible :key
          def self.name
            "#{options[:table_name].singularize.camelcase}"
          end

          def self.find(key)
            find_by_#{options[:key]}(key)
          end

          def self.find_or_initialize(key)
            if Rails::VERSION::MAJOR >= 4
              find_or_initialize_by(#{options[:key]}: key)
            else
              find_or_initialize_by_#{options[:key]}(key)
            end
          end

          def value=(val)
            write_attribute(:#{options[:value]}, val)
          end

          def value
            read_attribute(:#{options[:value]})
          end
        CODE

        establish_connection options[:connection] || raise("You must specify :connection")
        table_name = options[:table_name] || raise("You must specify :table_name")
      end
    end
  end
end
