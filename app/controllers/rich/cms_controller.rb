
module Rich
  class CmsController < ::ApplicationController
    before_filter :permit_params
    before_filter :require_login, :except => [:display, :position]

    def display
      session[:rich_cms_display] = params[:display]
      request.xhr? ? render(:nothing => true) : redirect_to("/")
    end

    def position
      session[:rich_cms_position] = params[:position]
      render :nothing => true
    end

    def update
      puts params
      css_class = params[:content_item][:__css_class__]
      identifier = params[:content_item][:store_key]
      value = params[:content_item][:store_value]
      puts "===> 1"
      content       = Cms::Content.fetch css_class, identifier
      puts "===> 2"
      content.value = value
      puts "===> 3"

      render :json => content.save_and_return(:always).to_json(params[:content_item])
    end

    def permit_params
      puts "BEFORE PERMIT"
      return if params[:content_item].nil?
      params[:content_item] = params.require(:content_item).permit(:__css_class__, :store_key, :store_value, :editable_input_type)
      puts "AFTER PERMIT"
    end

  private

    def require_login
      if Rich::Cms::Auth.login_required?
        if request.xhr?
          render :update do |page|
            page.reload
          end
        else
          redirect_to request.referrer
        end
        return false
      end
      true
    end

  end
end
