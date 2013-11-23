module Rich
  class CmsSessionsController < ::ApplicationController
    before_filter :allow_params_authentication!, :only => :login
    layout false

    def login
      @success = Rich::Cms::Auth.login

      respond_to do |format|
        format.js
        format.html { redirect_to "/" }
      end
    end

    def logout
      Rich::Cms::Auth.logout

      respond_to do |format|
        format.html { redirect_to "/" }
      end
    end

  private

    # Tell warden that params authentication is allowed for that specific page.
    def allow_params_authentication!
      request.env["devise.allow_params_authentication"] = true
    end

  end
end